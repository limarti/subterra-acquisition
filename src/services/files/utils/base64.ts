/**
 * Base64 Encoding/Decoding Utilities for Uint8Array
 *
 * Provides utilities for converting between Uint8Array and base64 strings
 * for file storage operations.
 */

/**
 * Converts a Uint8Array to a base64 string
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string
{
  let binary = '';
  const len = bytes.byteLength;

  for (let i = 0; i < len; i++)
  {
    binary += String.fromCharCode(bytes[i]!);
  }

  return btoa(binary);
}

/**
 * Converts a base64 string to a Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array
{
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++)
  {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}
