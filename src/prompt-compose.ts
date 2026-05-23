/**
 * Shared prompt composition for all providers.
 *
 * Composes the effective instruction set from:
 *   - global base (container/CLAUDE.md)
 *   - enabled skill instructions (container/skills/<name>/SKILL.md)
 *   - MCP server instructions (declared in container.json)
 *   - per-group instructions (groups/<folder>/CLAUDE.md)
 */
import fs from 'fs';
import path from 'path';

import { GROUPS_DIR } from './config.js';
import { readContainerConfig } from './container-config.js';
import type { AgentGroup, PromptBundle } from './types.js';

const SHARED_CLAUDE_MD_HOST_PATH = path.join('container', 'CLAUDE.md');
const SKILLS_HOST_DIR = path.join('container', 'skills');
const MCP_TOOLS_HOST_SUBPATH = path.join('container', 'agent-runner', 'src', 'mcp-tools');

/**
 * Compose the full prompt bundle for an agent group.
 */
export function composePromptBundle(group: AgentGroup): PromptBundle {
  const groupDir = path.resolve(GROUPS_DIR, group.folder);
  const config = readContainerConfig(group.folder);

  const globalSections: string[] = [];

  // 1. Shared base instructions
  if (fs.existsSync(SHARED_CLAUDE_MD_HOST_PATH)) {
    globalSections.push(fs.readFileSync(SHARED_CLAUDE_MD_HOST_PATH, 'utf-8'));
  }

  // 2. Skill fragments
  let enabledSkills: string[];
  if (config.skills === 'all') {
    enabledSkills = fs.existsSync(SKILLS_HOST_DIR)
      ? fs.readdirSync(SKILLS_HOST_DIR).filter((e) => {
          try {
            return fs.statSync(path.join(SKILLS_HOST_DIR, e)).isDirectory();
          } catch {
            return false;
          }
        })
      : [];
  } else {
    enabledSkills = config.skills;
  }

  for (const skillName of enabledSkills.sort()) {
    const skillPath = path.join(SKILLS_HOST_DIR, skillName, 'SKILL.md');
    if (fs.existsSync(skillPath)) {
      globalSections.push(fs.readFileSync(skillPath, 'utf-8'));
    }
  }

  // 3. Built-in module fragments (MCP tools)
  const mcpToolsHostDir = path.join(process.cwd(), MCP_TOOLS_HOST_SUBPATH);
  if (fs.existsSync(mcpToolsHostDir)) {
    const modules = fs
      .readdirSync(mcpToolsHostDir)
      .filter((entry) => entry.endsWith('.instructions.md'))
      .sort();
    for (const entry of modules) {
      globalSections.push(fs.readFileSync(path.join(mcpToolsHostDir, entry), 'utf-8'));
    }
  }

  // 4. MCP server fragments
  for (const [name, mcp] of Object.entries(config.mcpServers)) {
    if (mcp.instructions) {
      globalSections.push(`## MCP Server: ${name}\n\n${mcp.instructions}`);
    }
  }

  // 5. Per-group instructions (CLAUDE.md)
  const claudeMdPath = path.join(groupDir, 'CLAUDE.md');
  const claudeLocalPath = path.join(groupDir, 'CLAUDE.local.md');

  let groupContent = '';
  if (fs.existsSync(claudeMdPath)) {
    const content = fs.readFileSync(claudeMdPath, 'utf-8');
    // If it's the generated wrapper, it doesn't count as real group content
    if (!content.includes('Composed at spawn')) {
      groupContent = content;
    }
  }

  // Fallback to CLAUDE.local.md if CLAUDE.md was the wrapper or empty
  if (!groupContent && fs.existsSync(claudeLocalPath)) {
    groupContent = fs.readFileSync(claudeLocalPath, 'utf-8');
  }

  return {
    globalInstructions: globalSections.join('\n\n---\n\n'),
    groupInstructions: groupContent,
    claudeUsesWorkspacePrompt: true,
  };
}
