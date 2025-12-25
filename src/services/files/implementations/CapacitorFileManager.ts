import { Filesystem, Directory } from '@capacitor/filesystem';
import type { IFileManager } from '../types/IFileManager';
import { uint8ArrayToBase64, base64ToUint8Array } from '../utils/base64';
import { GeoFolderDoesNotExistError } from '../exceptions/GeoFolderDoesNotExistError';

export class CapacitorFileManager implements IFileManager
{
  private directory = Directory.External;

  constructor() {}

  async save(data: Uint8Array, filename: string): Promise<void>
  {
    try
    {
      // Extract directory path from filename and ensure it exists
      const lastSlashIndex = filename.lastIndexOf('/');
      if (lastSlashIndex > 0)
      {
        const dirPath = filename.substring(0, lastSlashIndex);
        await this.ensureDirectoryExists(dirPath);
      }

      const base64 = uint8ArrayToBase64(data);

      await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: this.directory,
      });
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
      // Extract directory path from filename and ensure it exists
      const lastSlashIndex = filename.lastIndexOf('/');
      if (lastSlashIndex > 0)
      {
        const dirPath = filename.substring(0, lastSlashIndex);
        await this.ensureDirectoryExists(dirPath);
      }

      await Filesystem.appendFile({
        path: filename,
        data: data,
        directory: this.directory,
      });
    }
    catch (error)
    {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to append to file: ${errorMessage}`);
    }
  }

  private async ensureDirectoryExists(path: string): Promise<void>
  {
    try
    {
      // Check if directory exists
      await Filesystem.stat({
        path,
        directory: this.directory,
      });
    }
    catch
    {
      // Directory doesn't exist, create it recursively
      await Filesystem.mkdir({
        path,
        directory: this.directory,
        recursive: true,
      });
    }
  }

  async read(filename: string): Promise<Uint8Array | null>
  {
    try
    {
      const file = await Filesystem.readFile({
        path: filename,
        directory: this.directory,
      });

      let base64: string;

      if (typeof file.data === 'string')
      {
        base64 = file.data;
      }
      else if (file.data instanceof Blob)
      {
        base64 = await file.data.text();
      }
      else
      {
        throw new Error(`Unexpected file data type: ${typeof file.data}`);
      }

      return base64ToUint8Array(base64);
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
      await Filesystem.deleteFile({
        path: filename,
        directory: this.directory,
      });
    }
    catch (error)
    {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to delete file ${filename}: ${errorMessage}`);
    }
  }

  async listDirectory(path: string): Promise<string[]>
  {
    // Check if directory exists
    try
    {
      await Filesystem.stat({
        path,
        directory: this.directory,
      });
    }
    catch (e)
    {
      throw new GeoFolderDoesNotExistError(`Directory does not exist: ${path}`);
    }

    try
    {
      const result = await Filesystem.readdir({
        path,
        directory: this.directory,
      });

      return result.files.map(file => file.name);
    }
    catch (e)
    {
      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to list directory ${path}: ${errorMessage}`);
    }
  }
}
