/**
 * Log export result containing exported data and metadata
 */
export type LogExportResult = {
  /**
   * Binary encrypted data
   * Format: [IV - 12 bytes][RSA-encrypted AES key - 256 bytes][AES-encrypted data]
   */
  exportData: Uint8Array;

  /**
   * Timestamp in milliseconds when export was performed
   */
  timestamp: number;

  /**
   * Algorithm used for encryption
   */
  algorithm: string;
};
