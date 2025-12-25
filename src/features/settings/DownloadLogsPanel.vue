<template>
  <Card :title="$t('settings.download_logs.title')">
    <div class="flex flex-col rounded-b-sm p-4 gap-2">

      <!-- Download Logs button -->
      <div class="w-full">
        <button class="flex items-center cursor-pointer justify-between w-full px-3 py-2 rounded-md border"
                :class="{ 'opacity-50': isDownloading }"
                :disabled="isDownloading"
                @click="handleDownloadLogs">
          <div class="flex items-center gap-2 text-gray-200">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3V16M12 16L16 12M12 16L8 12" stroke="var(--color-accent-primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M3 17V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V17" stroke="var(--color-accent-primary)" stroke-width="1.5" stroke-linecap="round" />
            </svg>

            {{ $t('settings.download_logs.label') }}
          </div>

          <div class="flex items-center gap-1 text-gray-400">
            <svg v-if="isDownloading" class="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <svg v-else class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
        </button>
      </div>

    </div>
  </Card>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { Capacitor } from '@capacitor/core';
  import { Share } from '@capacitor/share';
  import { Filesystem, Directory } from '@capacitor/filesystem';
  import { useToast } from '@/common/composables/useToast';
  import { useSystemLoggerStore } from '@/services/logging/stores/useSystemLoggerStore';
  import { encryptString } from '@/services/logging/utils/encryption';
  import { uint8ArrayToBase64 } from '@/services/files/utils/base64';
  import Card from '@/features/dashboard/Card.vue';
  import ToastNotification from '@/common/components/ToastNotification.vue';
  import { ToastType } from '@/common/types/ToastType';
  import type { LogEntry } from '@/services/logging/types/LogEntry';
  import { downloadBlobAsFile } from '@/common/utils/downloadBlobAsFile';

  const { t } = useI18n();
  const { show } = useToast();
  const loggerStore = useSystemLoggerStore();

  const isDownloading = ref(false);

  /**
   * RSA public key in JWK (JSON Web Key) format for log encryption.
   *
   * TEST KEY - MUST BE REPLACED FOR PRODUCTION
   *
   * To generate a production key pair, run in browser console or Node.js:
   *
   * const keyPair = await crypto.subtle.generateKey(
   *   {
   *     name: 'RSA-OAEP',
   *     modulusLength: 2048,
   *     publicExponent: new Uint8Array([1, 0, 1]),
   *     hash: 'SHA-256'
   *   },
   *   true,
   *   ['encrypt', 'decrypt']
   * );
   *
   * const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey); // (put in app)
   * const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey); // (keep secure for decryption)
   */
  const SUPPORT_TEAM_PUBLIC_KEY: JsonWebKey = {
    kty: 'RSA',
    e: 'AQAB',
    n: '0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw',
    alg: 'RSA-OAEP-256',
    ext: true,
    key_ops: ['encrypt']
  };

  const formatLogEntry = (entry: LogEntry): string =>
  {
    const timestamp = new Date(entry.timestamp).toISOString();
    return `[${timestamp}] [${entry.type}] ${entry.message}`;
  };

  const handleDownloadLogs = async () =>
  {
    if (isDownloading.value) return;

    isDownloading.value = true;

    try
    {
      const logs = loggerStore.getAllLogs();
      const formattedLogs = logs.map(formatLogEntry).join('\n');

      const result = await encryptString(
        formattedLogs,
        SUPPORT_TEAM_PUBLIC_KEY
      );

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `logs-${timestamp}.enc`;

      if (Capacitor.isNativePlatform())
      {
        const base64Data = uint8ArrayToBase64(result.exportData);

        const writeResult = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Cache,
        });

        try
        {
          await Share.share({
            files: [writeResult.uri],
          });
        }
        catch
        {
          // User dismissed share dialog - not an error
        }
      }
      else
      {
        const blob = new Blob([result.exportData.buffer as ArrayBuffer], { type: 'application/octet-stream' });
        downloadBlobAsFile(blob, filename);
      }
    }
    catch (error)
    {
      show(ToastNotification, { message: t('settings.download_logs.error'), type: ToastType.ERROR });
    }
    finally
    {
      isDownloading.value = false;
    }
  };
</script>
