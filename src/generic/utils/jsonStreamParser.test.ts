/**
 * Test suite for jsonStreamParser using Vitest
 * Tests both basic functionality and advanced embedded JSON extraction
 */

import { describe, test, expect } from 'vitest';
import { parseJsonStream } from './jsonStreamParser.js';

describe('jsonStreamParser', () => 
{
  describe('Basic valid cases', () => 
  {
    test('single complete JSON object', () => 
    {
      const result = parseJsonStream('{"test": true}');
      expect(result.jsonObjects).toEqual([{ "test": true }]);
      expect(result.remainingBuffer).toBe('');
    });

    test('multiple complete JSON objects', () => 
    {
      const result = parseJsonStream('{"first": 1}{"second": 2}');
      expect(result.jsonObjects).toEqual([{ "first": 1 }, { "second": 2 }]);
      expect(result.remainingBuffer).toBe('');
    });

    test('three complete JSON objects', () => 
    {
      const result = parseJsonStream('{"a": 1}{"b": 2}{"c": 3}');
      expect(result.jsonObjects).toEqual([{ "a": 1 }, { "b": 2 }, { "c": 3 }]);
      expect(result.remainingBuffer).toBe('');
    });

    test('empty buffer', () => 
    {
      const result = parseJsonStream('');
      expect(result.jsonObjects).toEqual([]);
      expect(result.remainingBuffer).toBe('');
    });

    test('incomplete JSON object (should remain in buffer)', () => 
    {
      const result = parseJsonStream('{"incomplete": ');
      expect(result.jsonObjects).toEqual([]);
      expect(result.remainingBuffer).toBe('{"incomplete": ');
    });
  });

  describe('Corruption cases', () => 
  {
    test('corrupted prefix with valid JSON', () => 
    {
      const result = parseJsonStream('garbage{"valid": true}');
      expect(result.jsonObjects).toEqual([{ "valid": true }]);
      expect(result.remainingBuffer).toBe('');
    });

    test('corrupted data between valid JSON objects', () => 
    {
      const result = parseJsonStream('{"first": 1}garbage{"second": 2}');
      expect(result.jsonObjects).toEqual([{ "first": 1 }, { "second": 2 }]);
      expect(result.remainingBuffer).toBe('');
    });

    test('incomplete JSON fragment (current corruption case)', () => 
    {
      const result = parseJsonStream('{"Handle":2,"ScanData":"L{');
      expect(result.jsonObjects).toEqual([]);
      expect(result.remainingBuffer).toBe('{"Handle":2,"ScanData":"L{');
    });
  });

  describe('Embedded JSON cases (the main challenge)', () => 
  {
    test('embedded JSON in corrupted structure', () => 
    {
      const result = parseJsonStream('{fdsfg: "fdgf, nex{"validJsonHere": true}');
      expect(result.jsonObjects).toEqual([{ "validJsonHere": true }]);
      expect(result.remainingBuffer).toBe('');
    });

    test('multiple embedded JSON objects', () => 
    {
      const result = parseJsonStream('{broken1{"obj1": "value1"}more broken{"obj2": "value2"}end');
      expect(result.jsonObjects).toEqual([{ "obj1": "value1" }, { "obj2": "value2" }]);
      expect(result.remainingBuffer).toBe('');
    });

    test('deeply nested embedded JSON', () => 
    {
      const result = parseJsonStream('{bad{also bad{"good": "data"}still bad{"another": "good"}');
      expect(result.jsonObjects).toEqual([{ "good": "data" }, { "another": "good" }]);
      expect(result.remainingBuffer).toBe('');
    });

    test('embedded JSON with arrays', () => 
    {
      const result = parseJsonStream('{corrupted{"valid": [1, 2, 3]}more corruption');
      expect(result.jsonObjects).toEqual([{ "valid": [1, 2, 3] }]);
      expect(result.remainingBuffer).toBe('');
    });

    test('embedded JSON with nested objects', () => 
    {
      const result = parseJsonStream('{bad{"nested": {"inner": {"deep": true}}}bad');
      expect(result.jsonObjects).toEqual([{ "nested": { "inner": { "deep": true } } }]);
      expect(result.remainingBuffer).toBe('');
    });
  });

  describe('Edge cases', () => 
  {
    test('JSON with escaped quotes', () => 
    {
      const result = parseJsonStream('{"text": "He said \\"hello\\""}');
      expect(result.jsonObjects).toEqual([{ "text": 'He said "hello"' }]);
      expect(result.remainingBuffer).toBe('');
    });

    test('JSON with escaped backslashes', () => 
    {
      const result = parseJsonStream('{"path": "C:\\\\Users\\\\test"}');
      expect(result.jsonObjects).toEqual([{ "path": "C:\\Users\\test" }]);
      expect(result.remainingBuffer).toBe('');
    });

    test('only corrupted data (no valid JSON)', () => 
    {
      const result = parseJsonStream('{broken: data, no quotes, invalid syntax');
      expect(result.jsonObjects).toEqual([]);
      expect(result.remainingBuffer).toBe('{broken: data, no quotes, invalid syntax');
    });

    test('JSON with special characters', () => 
    {
      const result = parseJsonStream('{"unicode": "Hello 🌍", "newline": "line1\\nline2"}');
      expect(result.jsonObjects).toEqual([{ "unicode": "Hello 🌍", "newline": "line1\nline2" }]);
      expect(result.remainingBuffer).toBe('');
    });

    test('empty JSON object', () => 
    {
      const result = parseJsonStream('{}');
      expect(result.jsonObjects).toEqual([{}]);
      expect(result.remainingBuffer).toBe('');
    });

    test('JSON with null values', () => 
    {
      const result = parseJsonStream('{"nullValue": null, "number": 42}');
      expect(result.jsonObjects).toEqual([{ "nullValue": null, "number": 42 }]);
      expect(result.remainingBuffer).toBe('');
    });
  });

  describe('Real-world scenarios', () => 
  {
    test('radar data pattern with corruption', () => 
    {
      const input = '{"Handle":2,"ScanData":"validBase64Data"}{"Position":{"x":1,"y":2}}{"Handle":2,"ScanData":"L{{"MessageType":9}';
      const result = parseJsonStream(input);
      expect(result.jsonObjects).toEqual([
        { "Handle":2,"ScanData":"validBase64Data" }, 
        { "Position":{ "x":1,"y":2 } },
        { "MessageType":9 }
      ]);
      expect(result.remainingBuffer).toBe('');
    });

    test('mixed valid and embedded corruption', () => 
    {
      const result = parseJsonStream('{"start": true}{corrupted{"embedded": "json"}more{"end": true}');
      expect(result.jsonObjects).toEqual([
        { "start": true },
        { "embedded": "json" }, 
        { "end": true }
      ]);
      expect(result.remainingBuffer).toBe('');
    });

    test('partial valid object at end (should remain)', () => 
    {
      const result = parseJsonStream('{"complete": true}{"partial": ');
      expect(result.jsonObjects).toEqual([{ "complete": true }]);
      expect(result.remainingBuffer).toBe('{"partial": ');
    });

    test('very large valid JSON (should handle normally)', () => 
    {
      const largeData = { "data": "x".repeat(1000), "size": "large" };
      const input = JSON.stringify(largeData);
      const result = parseJsonStream(input);
      expect(result.jsonObjects).toEqual([largeData]);
      expect(result.remainingBuffer).toBe('');
    });

    test('null bytes in stream', () => 
    {
      const result = parseJsonStream('garbage\x00\x00{"valid": true}\x00more');
      expect(result.jsonObjects).toEqual([{ "valid": true }]);
      expect(result.remainingBuffer).toBe('');
    });

    test('random binary data with embedded JSON', () => 
    {
      const binaryGarbage = '\xFF\xFE\x00\x01\x80\x90';
      const result = parseJsonStream(binaryGarbage + '{"extracted": "data"}' + binaryGarbage);
      expect(result.jsonObjects).toEqual([{ "extracted": "data" }]);
      expect(result.remainingBuffer).toBe('');
    });

    test('incomplete UTF-8 sequences', () => 
    {
      // Incomplete UTF-8 byte sequence followed by valid JSON
      const result = parseJsonStream('\xC2{"valid": "after incomplete utf8"}');
      expect(result.jsonObjects).toEqual([{ "valid": "after incomplete utf8" }]);
      expect(result.remainingBuffer).toBe('');
    });

    test('mixed control characters', () => 
    {
      const result = parseJsonStream('\x01\x02\x03{"data": "clean"}\x1F\x7F');
      expect(result.jsonObjects).toEqual([{ "data": "clean" }]);
      expect(result.remainingBuffer).toBe('');
    });

    test('high-bit set bytes (potential encoding issues)', () => 
    {
      const result = parseJsonStream('\x80\x90\xA0{"recovered": true}\xFF');
      expect(result.jsonObjects).toEqual([{ "recovered": true }]);
      expect(result.remainingBuffer).toBe('');
    });
  });
});