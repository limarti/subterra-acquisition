import type { LogType } from './LogType';

/**
 * Individual log entry structure
 */
export type LogEntry = {
  /**
   * Timestamp in milliseconds (Date.now())
   */
  timestamp: number;

  /**
   * Type of log entry
   */
  type: LogType;

  /**
   * Human-readable log message content
   */
  message: string;
};
