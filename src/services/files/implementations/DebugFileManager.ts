import type { IFileManager } from '../types/IFileManager';
import { IndexedDBHelper } from '@/generic/utils/IndexedDBHelper';
import { uint8ArrayToBase64, base64ToUint8Array } from '../utils/base64';
import { GeoFolderDoesNotExistError } from '../exceptions/GeoFolderDoesNotExistError';

/**
 * Debug File Manager - Uses IndexedDB for file storage
 *
 * This implementation uses IndexedDB to store files as base64-encoded strings,
 * providing a similar experience to the Capacitor file system but for web/debug environments.
 */
export class DebugFileManager implements IFileManager
{
  private dbHelper: IndexedDBHelper;

  constructor()
  {
    this.dbHelper = new IndexedDBHelper('DebugFileSystem', 'files');
    this.init();
  }

  private async init(): Promise<void>
  {
    await this.dbHelper.init();
  }

  async save(data: Uint8Array, filename: string): Promise<void>
  {
    try
    {
      const base64 = uint8ArrayToBase64(data);
      await this.dbHelper.write(filename, base64);
    }
    catch (error)
    {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to save file: ${errorMessage}`);
    }
  }

  async append(data: string, filename: string): Promise<void>
  {
    try
    {
      // Read existing content (if any)
      let existingContent = '';
      const existingBase64 = await this.dbHelper.read(filename);

      if (existingBase64)
      {
        const existingBytes = base64ToUint8Array(existingBase64);
        existingContent = new TextDecoder().decode(existingBytes);
      }

      // Append new data and save
      const newContent = existingContent + data;
      const newBase64 = uint8ArrayToBase64(new TextEncoder().encode(newContent));
      await this.dbHelper.write(filename, newBase64);
    }
    catch (error)
    {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to append to file: ${errorMessage}`);
    }
  }

  async read(filename: string): Promise<Uint8Array | null>
  {
    try
    {
      const base64 = await this.dbHelper.read(filename);
      return base64 ? base64ToUint8Array(base64) : null;
    }
    catch (e)
    {
      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to read file ${filename}: ${errorMessage}`);
    }
  }

  async delete(filename: string): Promise<void>
  {
    try
    {
      await this.dbHelper.delete(filename);
    }
    catch (error)
    {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to delete file ${filename}: ${errorMessage}`);
    }
  }

  async listDirectory(path: string): Promise<string[]>
  {
    try
    {
      const allKeys = await this.dbHelper.getAllKeys();
      const pathPrefix = path.endsWith('/') ? path : `${path}/`;

      // Check if any files exist in or under this directory
      const hasContent = allKeys.some(key => key.startsWith(pathPrefix));

      if (!hasContent)
      {
        throw new GeoFolderDoesNotExistError(`Directory does not exist: ${path}`);
      }

      const directories = new Set<string>();

      for (const key of allKeys)
      {
        if (key.startsWith(pathPrefix))
        {
          const relativePath = key.substring(pathPrefix.length);
          const firstSegment = relativePath.split('/')[0];

          if (firstSegment)
          {
            directories.add(firstSegment);
          }
        }
      }

      return Array.from(directories);
    }
    catch (e)
    {
      if (e instanceof GeoFolderDoesNotExistError)
      {
        throw e;
      }
      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to list directory ${path}: ${errorMessage}`);
    }
  }
}
