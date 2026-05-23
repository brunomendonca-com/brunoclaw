import { describe, expect, it } from 'vitest';

import { composePromptBundle } from './prompt-compose.js';
import type { AgentGroup } from './types.js';

describe('composePromptBundle', () => {
  it('loads container skills from standard SKILL.md files', () => {
    const group: AgentGroup = {
      id: 'ag-test',
      name: 'Test Agent',
      folder: '__missing_prompt_compose_test_group__',
      agent_provider: null,
      created_at: '2026-01-01T00:00:00.000Z',
    };

    const bundle = composePromptBundle(group);

    expect(bundle.globalInstructions).toContain('name: welcome');
    expect(bundle.globalInstructions).toContain('# /welcome');
  });
});
