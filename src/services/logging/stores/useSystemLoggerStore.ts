import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { LogEntry } from '../types/LogEntry';
import { LogType } from '../types/LogType';

/**
 * System logging store for in-memory communication logging
 */
export const useSystemLoggerStore = defineStore('systemLogger', () =>
{
  const RADAR_SCAN_SAMPLE_RATE = 1000; // (log 1 in every 1000 scans)
  const MAX_RADAR_SCAN_LOGS = 100;
  const MAX_LOG_LINES = 10000;

  const logs = ref<LogEntry[]>([]);
  const scanLogs = ref<LogEntry[]>([]);
  const scanCounter = ref(0);

  const addLog = (type: LogType, message: object | string): void =>
  {
    if (type === LogType.RADAR_SCAN_DATA)
    {
      scanCounter.value++;

      if (scanCounter.value % RADAR_SCAN_SAMPLE_RATE === 0)
      {
        const entry: LogEntry = generateLogEntry(message, type);

        scanLogs.value.push(entry);

        if (scanLogs.value.length > MAX_RADAR_SCAN_LOGS)
        {
          scanLogs.value.shift();
        }

        scanCounter.value = 0;
      }
    }
    else
    {
      const entry: LogEntry = generateLogEntry(message, type);

      logs.value.push(entry);

      if (logs.value.length > MAX_LOG_LINES)
      {
        logs.value.shift();
      }
    }
  };

  const generateLogEntry = (message: string | object, type: LogType) =>
  {
    const serializedMessage = typeof message === 'string' ? message : JSON.stringify(message);

    const entry: LogEntry = {
      timestamp: Date.now(),
      type,
      message: serializedMessage
    };
    return entry;
  };

  const getAllLogs = (): LogEntry[] =>
  {
    return [...logs.value, ...scanLogs.value].sort((a, b) => a.timestamp - b.timestamp);
  };

  return {
    addLog,
    getAllLogs
  };
});
