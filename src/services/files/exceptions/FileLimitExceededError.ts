export class FileLimitExceededError extends Error
{
  constructor(message: string = 'Maximum number of files reached.')
  {
    super(message);
    this.name = 'FileLimitExceededError';
  }
}
