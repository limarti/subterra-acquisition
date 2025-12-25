export class GeoFolderDoesNotExistError extends Error
{
  constructor(message: string = 'Folder does not exist.')
  {
    super(message);
    this.name = 'GeoFolderDoesNotExistError';
  }
}
