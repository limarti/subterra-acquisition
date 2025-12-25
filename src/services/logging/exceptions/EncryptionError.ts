export class EncryptionError extends Error
{
  constructor(message: string, public readonly originalError?: Error)
  {
    super(message);
    this.name = 'EncryptionError';
  }
}
