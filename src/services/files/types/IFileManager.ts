export interface IFileManager {
  save(data: Uint8Array, filename: string): Promise<void>;
  append(data: string, filename: string): Promise<void>;
  read(filename: string): Promise<Uint8Array | null>;
  delete(filename: string): Promise<void>;
  listDirectory(path: string): Promise<string[]>;
}
