import { exec } from 'child_process';
import util from 'util';
import { logger } from './logger.js';
import { GoogleWorkspaceConfig } from './types.js';

const execAsync = util.promisify(exec);

export async function executeGoogleWorkspaceCommand(
  gwConfig: GoogleWorkspaceConfig | undefined,
  service: string,
  commandArgs: string[],
  resourceId?: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  if (!gwConfig) {
    return {
      stdout: '',
      stderr: 'Google Workspace is not configured for this group.',
      exitCode: 1,
    };
  }

  // Validate service (default to 'drive' only when not specified)
  const allowedServices = gwConfig.allowedServices ?? ['drive'];
  if (!allowedServices.includes(service)) {
    return {
      stdout: '',
      stderr: `Service '${service}' not allowed. Allowed services: ${allowedServices.join(', ')}`,
      exitCode: 1,
    };
  }

  // Services that operate on Drive resources require allowedDrives/allowedFolders.
  // Non-drive services (calendar, gmail, etc.) skip resource validation.
  const driveServices = ['drive', 'sheets', 'docs'];
  if (driveServices.includes(service)) {
    if (!gwConfig.allowedDrives?.length && !gwConfig.allowedFolders?.length) {
      return {
        stdout: '',
        stderr: `No allowedDrives or allowedFolders configured. Drive-based services require explicit resource access.`,
        exitCode: 1,
      };
    }
  }

  // Validate resource access (Union Logic)
  if (
    resourceId &&
    (gwConfig.allowedDrives?.length || gwConfig.allowedFolders?.length)
  ) {
    try {
      // Fetch the file parent/drive metadata using gws
      const getCmd = `gws drive files get --params '{"fileId": "${resourceId.replace(/[^a-zA-Z0-9-_]/g, '')}", "fields": "driveId,parents"}' --format json`;
      const { stdout: checkOut } = await execAsync(getCmd);
      const fileMeta = JSON.parse(checkOut);

      const fileDriveId = fileMeta.driveId;
      const fileParents: string[] = fileMeta.parents || [];

      const inAllowedDrive =
        fileDriveId && gwConfig.allowedDrives?.includes(fileDriveId);
      const inAllowedFolder = fileParents.some((p) =>
        gwConfig.allowedFolders?.includes(p),
      );
      const explicitlyAllowedFolder =
        gwConfig.allowedFolders?.includes(resourceId);

      if (!inAllowedDrive && !inAllowedFolder && !explicitlyAllowedFolder) {
        return {
          stdout: '',
          stderr: `Access denied. Resource '${resourceId}' is not in an allowed drive or folder.`,
          exitCode: 1,
        };
      }
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) {
        return {
          stdout: '',
          stderr: `Resource '${resourceId}' not found or you don't have access to check permissions.`,
          exitCode: 1,
        };
      }
      return {
        stdout: '',
        stderr: `Failed to validate permissions for resource: ${err instanceof Error ? err.message : String(err)}`,
        exitCode: 1,
      };
    }
  }

  // Execute the command
  // Quote arguments that have spaces to protect against basic injection
  const safeArgs = commandArgs.map((arg) => {
    return `'${arg.replace(/'/g, "'\\''")}'`;
  });

  const commandLine = `gws ${service} ${safeArgs.join(' ')}`;

  logger.info({ service, commandLine }, 'Executing Google Workspace command');

  try {
    const { stdout, stderr } = await execAsync(commandLine);
    return { stdout, stderr, exitCode: 0 };
  } catch (err: any) {
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || err.message,
      exitCode: err.code || 1,
    };
  }
}
