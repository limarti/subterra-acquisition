import { EncryptionError } from '../exceptions/EncryptionError';
import type { LogExportResult } from '../types/LogExportResult';

const importPublicKey = async (jwk: JsonWebKey): Promise<CryptoKey> =>
{
  try
  {
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      false,
      ['encrypt']
    );
  }
  catch (error)
  {
    throw new EncryptionError(
      'Failed to import public key',
      error instanceof Error ? error : undefined
    );
  }
};

const IV_LENGTH = 12;
const RSA_2048_ENCRYPTED_KEY_LENGTH = 256;

/**
 * Encrypt text data using hybrid encryption:
 * - AES-GCM for the data (no size limit)
 * - RSA-OAEP for the AES key
 *
 * Output format (binary):
 * [IV - 12 bytes][RSA-encrypted AES key - 256 bytes][AES-encrypted data]
 */
export const encryptString = async (
  plainText: string,
  publicKeyJwk: JsonWebKey
): Promise<LogExportResult> =>
{
  try
  {
    const rsaPublicKey = await importPublicKey(publicKeyJwk);

    const aesKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      data
    );

    const exportedAesKey = await crypto.subtle.exportKey('raw', aesKey);

    const encryptedAesKey = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      rsaPublicKey,
      exportedAesKey
    );

    // Concatenate: IV (12 bytes) + encrypted AES key (256 bytes) + encrypted data
    const totalLength = IV_LENGTH + RSA_2048_ENCRYPTED_KEY_LENGTH + encryptedData.byteLength;
    const binaryOutput = new Uint8Array(totalLength);

    binaryOutput.set(iv, 0);
    binaryOutput.set(new Uint8Array(encryptedAesKey), IV_LENGTH);
    binaryOutput.set(new Uint8Array(encryptedData), IV_LENGTH + RSA_2048_ENCRYPTED_KEY_LENGTH);

    return {
      exportData: binaryOutput,
      timestamp: Date.now(),
      algorithm: 'RSA-OAEP-256+AES-GCM-256'
    };
  }
  catch (error)
  {
    if (error instanceof EncryptionError)
    {
      throw error;
    }

    throw new EncryptionError(
      'Failed to encrypt string',
      error instanceof Error ? error : undefined
    );
  }
};
