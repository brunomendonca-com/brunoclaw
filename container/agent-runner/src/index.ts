/**
 * PipipiClaw Agent Runner
 * Runs inside a container, receives config via stdin, outputs result to stdout
 *
 * Input protocol:
 *   Stdin: Full ContainerInput JSON (read until EOF, like before)
 *   IPC:   Follow-up messages written as JSON files to /workspace/ipc/input/
 *          Files: {type:"message", text:"..."}.json — polled and consumed
 *          Sentinel: /workspace/ipc/input/_close — signals session end
 *
 * Stdout protocol:
 *   Each result is wrapped in OUTPUT_START_MARKER / OUTPUT_END_MARKER pairs.
 *   Multiple results may be emitted (one per agent teams result).
 *   Final marker after loop ends signals completion.
 */

import {
  createAgentSession,
  createCodingTools,
  createExtensionRuntime,
  type ResourceLoader,
  SessionManager,
  type Skill,
} from "@mariozechner/pi-coding-agent";
import { createRuntime, type Runtime } from "mcporter";
import type { ServerDefinition } from "mcporter";
import fs from "fs";
import path from "path";

const IPC_INPUT_DIR = "/workspace/ipc/input";
const IPC_INPUT_CLOSE_SENTINEL = path.join(IPC_INPUT_DIR, "_close");
const IPC_POLL_MS = 500;

interface ContainerInput {
  prompt: string;
  sessionId?: string;
  groupFolder: string;
  chatJid: string;
  isMain: boolean;
  isScheduledTask?: boolean;
  assistantName?: string;
  timezone?: string;
}

interface ContainerOutput {
  status: "success" | "error";
  result: string | null;
  newSessionId?: string;
  error?: string;
}

const OUTPUT_START_MARKER = "___RESULT_START___";
const OUTPUT_END_MARKER = "___RESULT_END___";

function writeOutput(output: ContainerOutput): void {
  console.log(OUTPUT_START_MARKER);
  console.log(JSON.stringify(output));
  console.log(OUTPUT_END_MARKER);
}

function log(message: string): void {
  console.error(`[agent-runner] ${message}`);
}

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

/**
 * Check for _close sentinel.
 */
function shouldClose(): boolean {
  if (fs.existsSync(IPC_INPUT_CLOSE_SENTINEL)) {
    try {
      fs.unlinkSync(IPC_INPUT_CLOSE_SENTINEL);
    } catch {
      /* ignore */
    }
    return true;
  }
  return false;
}

/**
 * Drain all pending IPC input messages.
 * Returns messages found, or empty array.
 */
function drainIpcInput(): string[] {
  try {
    fs.mkdirSync(IPC_INPUT_DIR, { recursive: true });
    const files = fs
      .readdirSync(IPC_INPUT_DIR)
      .filter((f) => f.endsWith(".json"))
      .sort();

    const messages: string[] = [];
    for (const file of files) {
      const filePath = path.join(IPC_INPUT_DIR, file);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        fs.unlinkSync(filePath);
        if (data.type === "message" && data.text) {
          messages.push(data.text);
        }
      } catch (err) {
        log(
          `Failed to process input file ${file}: ${err instanceof Error ? err.message : String(err)}`,
        );
        try {
          fs.unlinkSync(filePath);
        } catch {
          /* ignore */
        }
      }
    }
    return messages;
  } catch (err) {
    log(`IPC drain error: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

/**
 * Wait for a new IPC message or _close sentinel.
 * Returns the messages as a single string, or null if _close.
 */
function waitForIpcMessage(): Promise<string | null> {
  return new Promise((resolve) => {
    const poll = () => {
      if (shouldClose()) {
        resolve(null);
        return;
      }
      const messages = drainIpcInput();
      if (messages.length > 0) {
        resolve(messages.join("\n"));
        return;
      }
      setTimeout(poll, IPC_POLL_MS);
    };
    poll();
  });
}

/**
 * Load skill files from directory.
 */
function loadSkills(skillsDirs: string[]): string {
  const skills: string[] = [];
  for (const dir of skillsDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      const skillMd = path.join(dir, name, "SKILL.md");
      if (fs.existsSync(skillMd)) {
        skills.push(fs.readFileSync(skillMd, "utf8"));
      }
    }
  }
  return skills.join("\n\n---\n\n");
}

async function main(): Promise<void> {
  let containerInput: ContainerInput;

  try {
    const stdinData = await readStdin();
    containerInput = JSON.parse(stdinData);
    try {
      fs.unlinkSync("/tmp/input.json");
    } catch {
      /* may not exist */
    }
    log(`Received input for group: ${containerInput.groupFolder}`);
  } catch (err) {
    writeOutput({
      status: "error",
      result: null,
      error: `Failed to parse input: ${err instanceof Error ? err.message : String(err)}`,
    });
    process.exit(1);
  }

  // Load AGENTS.md for system prompt memory
  const GROUP_DIR = "/workspace/group";
  const agentsMdPath = path.join(GROUP_DIR, "AGENTS.md");
  const memory = fs.existsSync(agentsMdPath)
    ? fs.readFileSync(agentsMdPath, "utf8")
    : "";

  const systemPrompt = [
    `You are ${containerInput.assistantName ?? "Assistant"}, a helpful AI assistant.`,
    `Current timezone: ${containerInput.timezone ?? "UTC"}`,
    memory ? `\n\n## Context and instructions\n${memory}` : "",
  ].join("\n");

  // Model descriptor — Pi talks to our proxy as an OpenAI-compatible endpoint
  const model = {
    id: process.env.PI_MODEL ?? "default",
    name: process.env.PI_MODEL ?? "default",
    api: "openai-completions" as const,
    provider: "custom",
    baseUrl: process.env.OPENAI_BASE_URL + "",
    reasoning: false,
    input: ["text"] as ("text" | "image")[],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 200000,
    maxTokens: 8192,
  };

  const WORKSPACE = "/workspace";
  const SESSION_FILE = "/workspace/pi/session.jsonl";
  const sessionManager = SessionManager.open(SESSION_FILE);

  // Load skill files from the pi/skills directory mounted into the container.
  // Pi discovers skills from <cwd>/.pi/skills/, but our skills are mounted at
  // /workspace/pi/skills/ (no dot prefix), so we load them manually here.
  const skillsDirs = [
    path.join(GROUP_DIR, "pi", "skills"),
    "/workspace/pi/skills",
  ];
  const skillsText = loadSkills(skillsDirs);
  const fullSystemPrompt = systemPrompt + (skillsText ? `\n\n## Skills\n${skillsText}` : "");

  // Build skills array for Pi's ResourceLoader from our manually loaded skill text.
  // We inject all skill content as a single virtual skill so Pi includes it in the
  // system prompt without needing to discover files from the standard .pi/skills/ path.
  const piSkills: Skill[] = skillsText
    ? [
        {
          name: "pipipiclaw-skills",
          description: "Loaded skills for this session",
          filePath: "/virtual/SKILL.md",
          baseDir: "/virtual",
          sourceInfo: {
            path: "/virtual/SKILL.md",
            source: "path",
            scope: "project" as const,
            origin: "top-level" as const,
          },
          disableModelInvocation: false,
        },
      ]
    : [];

  // Custom ResourceLoader: inject system prompt and skills explicitly.
  // Pi's createAgentSession does not accept systemPrompt directly —
  // system prompt goes through the ResourceLoader interface.
  const resourceLoader: ResourceLoader = {
    getExtensions: () => ({ extensions: [], errors: [], runtime: createExtensionRuntime() }),
    getSkills: () => ({ skills: piSkills, diagnostics: [] }),
    getPrompts: () => ({ prompts: [], diagnostics: [] }),
    getThemes: () => ({ themes: [], diagnostics: [] }),
    getAgentsFiles: () => ({ agentsFiles: [] }),
    getSystemPrompt: () => fullSystemPrompt,
    getAppendSystemPrompt: () => [],
    extendResources: () => {},
    reload: async () => {},
  };

  // Bridge the IPC MCP server into Pi using MCPorter.
  // Pi has no native MCP support; MCPorter spawns the stdio server as a
  // subprocess and exposes its tools as Pi customTools.
  const ipcServerDef: ServerDefinition = {
    name: "pipipiclaw-ipc",
    command: {
      kind: "stdio",
      command: "node",
      args: ["/app/dist/ipc-mcp-stdio.js"],
      cwd: "/app",
    },
    env: {
      NANOCLAW_CHAT_JID: containerInput.chatJid,
      NANOCLAW_GROUP_FOLDER: containerInput.groupFolder,
      NANOCLAW_IS_MAIN: containerInput.isMain ? "1" : "0",
    },
  };

  const mcpRuntime: Runtime = await createRuntime({ servers: [ipcServerDef] });
  const mcpToolInfos = await mcpRuntime.listTools("pipipiclaw-ipc", {
    includeSchema: true,
  });
  log(`IPC tools loaded: ${mcpToolInfos.map((t) => t.name).join(", ")}`);

  const ipcCustomTools = mcpToolInfos.map((tool) => ({
    name: tool.name,
    label: tool.name.replace(/_/g, " "),
    description: tool.description ?? "",
    // MCPorter returns standard JSON Schema; cast to any since Pi's ToolDefinition
    // expects a TypeBox TSchema (which is a superset of JSON Schema at runtime).
    parameters: (tool.inputSchema ?? { type: "object", properties: {} }) as any,
    execute: async (_toolCallId: string, params: unknown) => {
      const result = await mcpRuntime.callTool("pipipiclaw-ipc", tool.name, {
        args: params as Record<string, unknown>,
      });
      const content = (result as { content?: Array<{ type: "text"; text: string }> })
        .content ?? [{ type: "text" as const, text: String(result) }];
      return { content, details: {} };
    },
  }));

  const { session } = await createAgentSession({
    cwd: WORKSPACE,
    model,
    resourceLoader,
    sessionManager,
    // createCodingTools(cwd) ensures read/write/edit/bash resolve paths
    // relative to /workspace, not /app where this process runs.
    tools: createCodingTools(WORKSPACE),
    customTools: ipcCustomTools,
  });

  // Subscribe to the event stream
  session.subscribe((event: any) => {
    if (event.type === "tool_execution_start") {
      process.stderr.write(`[tool:start] ${event.toolName}\n`);
    }
    if (event.type === "tool_execution_end") {
      process.stderr.write(`[tool:end] ${event.toolName} ${event.isError ? "ERROR" : "OK"}\n`);
    }
  });

  // Run initial prompt
  const buffer = await runPrompt(session, containerInput.prompt);
  process.stdout.write(`___RESULT_START___\n${buffer}\n___RESULT_END___\n`);

  // Follow-up message loop
  await pollFollowUps(session);

  // Clean up MCPorter subprocess
  await mcpRuntime.close().catch(() => {});
}

async function runPrompt(session: any, prompt: string): Promise<string> {
  let buffer = "";
  const unsub = session.subscribe((event: any) => {
    if (
      event.type === "message_update" &&
      event.assistantMessageEvent.type === "text_delta"
    ) {
      buffer += event.assistantMessageEvent.delta;
    }
  });
  await session.prompt(prompt);
  unsub();
  return buffer;
}

async function pollFollowUps(session: any): Promise<void> {
  while (true) {
    await sleep(500);
    const files = fs.readdirSync(IPC_INPUT_DIR).sort();
    for (const file of files) {
      const filePath = path.join(IPC_INPUT_DIR, file);
      if (file === "_close") {
        await session.close();
        process.exit(0);
      }
      const msg = JSON.parse(fs.readFileSync(filePath, "utf8"));
      fs.unlinkSync(filePath);
      if (msg.type === "message") {
        const buffer = await runPrompt(session, msg.text);
        process.stdout.write(`___RESULT_START___\n${buffer}\n___RESULT_END___\n`);
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  process.stderr.write(`[fatal] ${e}\n`);
  process.exit(1);
});
