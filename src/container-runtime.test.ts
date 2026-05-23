import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock log
vi.mock('./log.js', () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  },
}));

// Mock child_process — store the mock fn so tests can configure it
const mockExecSync = vi.fn();
vi.mock('child_process', () => ({
  execSync: (...args: unknown[]) => mockExecSync(...args),
}));

// Mock fs.statSync so heartbeat freshness can be controlled per test.
const mockStatSync = vi.fn();
vi.mock('fs', () => ({
  default: { statSync: (...args: unknown[]) => mockStatSync(...args) },
  statSync: (...args: unknown[]) => mockStatSync(...args),
}));

// Avoid pulling the real session-manager / container-runner (DB, child_process,
// onecli) into the test graph — only the symbols cleanupOrphans uses matter.
vi.mock('./session-manager.js', () => ({
  heartbeatPath: (agentGroupId: string, sessionId: string) => `/tmp/${agentGroupId}/${sessionId}/.heartbeat`,
}));
const mockAdopt = vi.fn();
vi.mock('./container-runner.js', () => ({
  adoptRunningContainer: (sessionId: string, containerName: string) => mockAdopt(sessionId, containerName),
}));

import {
  CONTAINER_RUNTIME_BIN,
  readonlyMountArgs,
  stopContainer,
  ensureContainerRuntimeRunning,
} from './container-runtime.js';
import { cleanupOrphans } from './container-reconciler.js';
import { log } from './log.js';

beforeEach(() => {
  vi.clearAllMocks();
});

// --- Pure functions ---

describe('readonlyMountArgs', () => {
  it('returns -v flag with :ro suffix', () => {
    const args = readonlyMountArgs('/host/path', '/container/path');
    expect(args).toEqual(['-v', '/host/path:/container/path:ro']);
  });
});

describe('stopContainer', () => {
  it('calls docker stop for valid container names', () => {
    stopContainer('nanoclaw-test-123');
    expect(mockExecSync).toHaveBeenCalledWith(`${CONTAINER_RUNTIME_BIN} stop -t 1 nanoclaw-test-123`, {
      stdio: 'pipe',
    });
  });

  it('rejects names with shell metacharacters', () => {
    expect(() => stopContainer('foo; rm -rf /')).toThrow('Invalid container name');
    expect(() => stopContainer('foo$(whoami)')).toThrow('Invalid container name');
    expect(() => stopContainer('foo`id`')).toThrow('Invalid container name');
    expect(mockExecSync).not.toHaveBeenCalled();
  });
});

// --- ensureContainerRuntimeRunning ---

describe('ensureContainerRuntimeRunning', () => {
  it('does nothing when runtime is already running', () => {
    mockExecSync.mockReturnValueOnce('');

    ensureContainerRuntimeRunning();

    expect(mockExecSync).toHaveBeenCalledTimes(1);
    expect(mockExecSync).toHaveBeenCalledWith(`${CONTAINER_RUNTIME_BIN} info`, {
      stdio: 'pipe',
      timeout: 10000,
    });
    expect(log.debug).toHaveBeenCalledWith('Container runtime already running');
  });

  it('throws when docker info fails', () => {
    mockExecSync.mockImplementationOnce(() => {
      throw new Error('Cannot connect to the Docker daemon');
    });

    expect(() => ensureContainerRuntimeRunning()).toThrow('Container runtime is required but failed to start');
    expect(log.error).toHaveBeenCalled();
  });
});

// --- cleanupOrphans ---

describe('cleanupOrphans', () => {
  beforeEach(() => {
    mockStatSync.mockReset();
    mockAdopt.mockReset();
  });

  it('stops orphaned nanoclaw containers with stale heartbeats', () => {
    // labeled ps + legacy ps + 2 stops
    mockExecSync.mockReturnValueOnce('nanoclaw-group1-111\tsess-1\tag-1\nnanoclaw-group2-222\tsess-2\tag-2\n');
    // both heartbeats stale (>5min)
    mockStatSync.mockReturnValue({ mtimeMs: Date.now() - 10 * 60 * 1000 });
    // legacy ps returns nothing
    mockExecSync.mockReturnValueOnce('');
    // stop calls succeed
    mockExecSync.mockReturnValue('');

    cleanupOrphans();

    // labeled ps + legacy ps + 2 stops
    expect(mockExecSync).toHaveBeenCalledTimes(4);
    expect(mockExecSync).toHaveBeenNthCalledWith(2, `${CONTAINER_RUNTIME_BIN} stop -t 1 nanoclaw-group1-111`, {
      stdio: 'pipe',
    });
    expect(mockExecSync).toHaveBeenNthCalledWith(3, `${CONTAINER_RUNTIME_BIN} stop -t 1 nanoclaw-group2-222`, {
      stdio: 'pipe',
    });
    expect(log.info).toHaveBeenCalledWith('Stopped orphaned containers', {
      count: 2,
      names: ['nanoclaw-group1-111', 'nanoclaw-group2-222'],
    });
    expect(mockAdopt).not.toHaveBeenCalled();
  });

  it('adopts containers with fresh heartbeats instead of stopping', () => {
    mockExecSync.mockReturnValueOnce('nanoclaw-group1-111\tsess-1\tag-1\n');
    // fresh heartbeat
    mockStatSync.mockReturnValue({ mtimeMs: Date.now() - 5_000 });
    // legacy ps empty
    mockExecSync.mockReturnValueOnce('');

    cleanupOrphans();

    expect(mockAdopt).toHaveBeenCalledWith('sess-1', 'nanoclaw-group1-111');
    // labeled ps + legacy ps, no stops
    expect(mockExecSync).toHaveBeenCalledTimes(2);
    expect(log.info).toHaveBeenCalledWith('Adopted running containers', {
      count: 1,
      names: ['nanoclaw-group1-111'],
    });
  });

  it('stops legacy containers (no labels) discovered by name prefix', () => {
    // labeled ps empty
    mockExecSync.mockReturnValueOnce('');
    // legacy ps finds an unlabeled container
    mockExecSync.mockReturnValueOnce('nanoclaw-old-999\n');
    mockExecSync.mockReturnValueOnce('');

    cleanupOrphans();

    // labeled ps (1), legacy ps (2), stop legacy (3)
    expect(mockExecSync).toHaveBeenNthCalledWith(3, `${CONTAINER_RUNTIME_BIN} stop -t 1 nanoclaw-old-999`, {
      stdio: 'pipe',
    });
    expect(log.info).toHaveBeenCalledWith('Stopped orphaned containers', {
      count: 1,
      names: ['nanoclaw-old-999'],
    });
  });

  it('does nothing when no containers exist', () => {
    mockExecSync.mockReturnValueOnce('');
    mockExecSync.mockReturnValueOnce('');

    cleanupOrphans();

    expect(mockExecSync).toHaveBeenCalledTimes(2);
    expect(log.info).not.toHaveBeenCalled();
  });

  it('warns and continues when ps fails', () => {
    mockExecSync.mockImplementationOnce(() => {
      throw new Error('docker not available');
    });

    cleanupOrphans(); // should not throw

    expect(log.warn).toHaveBeenCalledWith(
      'Failed to clean up orphaned containers',
      expect.objectContaining({ err: expect.any(Error) }),
    );
  });

  it('continues stopping remaining containers when one stop fails', () => {
    mockExecSync.mockReturnValueOnce('nanoclaw-a-1\tsess-a\tag-a\nnanoclaw-b-2\tsess-b\tag-b\n');
    mockStatSync.mockReturnValue({ mtimeMs: Date.now() - 10 * 60 * 1000 });
    // First stop fails
    mockExecSync.mockImplementationOnce(() => {
      throw new Error('already stopped');
    });
    // Second stop succeeds
    mockExecSync.mockReturnValueOnce('');
    // legacy ps empty
    mockExecSync.mockReturnValueOnce('');

    cleanupOrphans(); // should not throw

    expect(log.info).toHaveBeenCalledWith('Stopped orphaned containers', {
      count: 2,
      names: ['nanoclaw-a-1', 'nanoclaw-b-2'],
    });
  });
});
