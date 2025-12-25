import { describe, it, expect } from 'vitest';
import { encryptString } from './encryption';

describe('encryptString', () =>
{
  const testData = `[2025-11-18T19:21:26.736Z] [MESSAGE_RECEIVED] {"Version":"1.0.0","MessageType":12,"MessageID":2}
[2025-11-18T19:21:26.739Z] [COMMAND_SENT] {"MessageType":1,"PollMessage":5}
[2025-11-18T19:21:26.751Z] [MESSAGE_RECEIVED] {"BatteryPercentRemaining":24,"Chan0DepthZeroSample":5,"Chan0SamplesPerScan":1024,"Chan0ScansPerMeter":400,"Chan0TimeRangeNS":25,"Chan0TimeZeroSample":38,"Chan1DepthZeroSample":5,"Chan1SamplesPerScan":1024,"Chan1ScansPerMeter":400,"Chan1TimeRangeNS":25,"Chan1TimeZeroSample":38,"Connected":true,"CurrentVersion":"0.0","Handle":2,"MessageID":6,"MessageType":5,"Model":"FlexNX","NumChannels":2,"RadarUp":true,"SerialNumber":"01010","TotalDeviceCount":1}`;

  it('should encrypt string data correctly', async () =>
  {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    );

    const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);

    const result = await encryptString(testData, publicKeyJwk);

    expect(result.exportData).toBeDefined();
    expect(result.exportData).not.toBe(testData);
    expect(result.algorithm).toBe('RSA-OAEP-256+AES-GCM-256');
    expect(result.timestamp).toBeDefined();
    expect(typeof result.timestamp).toBe('number');
  });

  it('should produce different encrypted output for same input', async () =>
  {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    );

    const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);

    const result1 = await encryptString(testData, publicKeyJwk);
    const result2 = await encryptString(testData, publicKeyJwk);

    // Different IVs should produce different encrypted data
    expect(result1.exportData).not.toBe(result2.exportData);
  });
});
