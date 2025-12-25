import { inject } from 'vue';
import type { IFileManager } from '../types/IFileManager';
import { FILE_PLUGIN_KEY } from '../fileVuePlugin';

export const useFileManager = (): IFileManager =>
{
  const fileManager = inject<IFileManager>(FILE_PLUGIN_KEY);
  if (!fileManager)
  {
    throw new Error('FileManager not provided');
  }

  return {
    save: (data: Uint8Array, filename: string) => fileManager.save(data, filename),
    append: (data: string, filename: string) => fileManager.append(data, filename),
    read: (filename: string) => fileManager.read(filename),
    delete: (filename: string) => fileManager.delete(filename),
    listDirectory: (path: string) => fileManager.listDirectory(path)
  };
};
