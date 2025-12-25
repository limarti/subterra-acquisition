import type { App } from 'vue';

import { DebugFileManager } from './implementations/DebugFileManager';
import { CapacitorFileManager } from './implementations/CapacitorFileManager';
import type { IFileManager } from './types/IFileManager';
import { getAppMode } from '@/common/utils/appMode';

const FILE_PLUGIN_KEY = Symbol('FileManager');

export function createFileManagerPlugin()
{
  return {
    install(app: App)
    {
      const mode = getAppMode();
      const fileManager: IFileManager = mode === 'debug' || mode === 'web-preview' ? new DebugFileManager() : new CapacitorFileManager();

      app.provide(FILE_PLUGIN_KEY, fileManager);
    }
  };
}

export { FILE_PLUGIN_KEY };
