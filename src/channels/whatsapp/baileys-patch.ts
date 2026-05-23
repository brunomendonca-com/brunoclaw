import { createRequire } from 'module';

import { log } from '../../log.js';

const requireBaileys = createRequire(import.meta.url);

// Baileys v6 bug: getPlatformId sends charCode (49) instead of enum value (1).
// Fixed in Baileys 7.x but not backported. Without this, pairing codes fail.
export const { proto } = requireBaileys('@whiskeysockets/baileys') as { proto: any };

export function patchBaileysPairingPlatformId(): void {
  try {
    const generics = requireBaileys('@whiskeysockets/baileys/lib/Utils/generics') as Record<string, unknown>;
    generics.getPlatformId = (browser: string): string => {
      const platformType =
        proto.DeviceProps.PlatformType[browser.toUpperCase() as keyof typeof proto.DeviceProps.PlatformType];
      return platformType ? platformType.toString() : '1';
    };
  } catch {
    // If CJS require fails (Node version mismatch), pairing codes may not work
    // but QR auth will still function fine.
    log.warn('Could not patch getPlatformId — pairing code auth may fail');
  }
}
