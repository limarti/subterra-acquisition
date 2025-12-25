/**
 * Localization Test Suite
 *
 * Ensures the Spanish translation file is properly structured
 */

import { describe, test, expect } from 'vitest';
import es from './locales/es.json';

type LocaleData = Record<string, any>;

describe('Localization Structure Validation', () =>
{
  test('es.json should be properly structured', () =>
  {
    expect(typeof es).toBe('object');
    expect(es).not.toBe(null);
    expect(Array.isArray(es)).toBe(false);
    expect(Object.keys(es).length).toBeGreaterThan(0);
  });
});

describe('Localization Content Validation', () =>
{
  test('es.json should not have empty string values', () =>
  {
    const emptyValues: string[] = [];

    function checkForEmptyValues(obj: LocaleData, path: string = '')
    {
      for (const key in obj)
      {
        const currentPath = path ? `${path}.${key}` : key;
        const value = obj[key];

        if (typeof value === 'string' && value.trim() === '')
        {
          emptyValues.push(currentPath);
        }
        else if (typeof value === 'object' && value !== null && !Array.isArray(value))
        {
          checkForEmptyValues(value, currentPath);
        }
      }
    }

    checkForEmptyValues(es);

    if (emptyValues.length > 0)
    {
      throw new Error(`Empty string values found in es.json: ${emptyValues.join(', ')}`);
    }

    expect(emptyValues).toEqual([]);
  });
});
