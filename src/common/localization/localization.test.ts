/**
 * Localization Test Suite
 * 
 * Ensures all translation files have identical structure and key ordering
 * compared to en.json (source of truth)
 */

import { describe, test, expect } from 'vitest';
import en from './locales/en.json';
import es from './locales/es.json';
import languages from './locales/languages.json';

type LocaleData = Record<string, any>;
type KeyPath = string[];

/**
 * Recursively extracts all keys from a locale object with their paths
 * @param obj The locale object to extract keys from
 * @param path The current path (for nested objects)
 * @returns Array of key paths as dot-separated strings
 */
function extractKeysWithPaths(obj: LocaleData, path: KeyPath = []): string[] 
{
  const keys: string[] = [];
  
  for (const key in obj) 
  {
    const currentPath = [...path, key];
    const pathString = currentPath.join('.');
    keys.push(pathString);
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) 
    {
      keys.push(...extractKeysWithPaths(obj[key], currentPath));
    }
  }
  
  return keys;
}

/**
 * Extracts keys in their original order from a locale object
 * This preserves the ordering of keys at each level
 */
function extractOrderedKeys(obj: LocaleData, path: KeyPath = []): Array<{path: string, order: number[]}> 
{
  const keyInfo: Array<{path: string, order: number[]}> = [];
  const topLevelKeys = Object.keys(obj);
  
  topLevelKeys.forEach((key, index) => 
  {
    const currentPath = [...path, key];
    const pathString = currentPath.join('.');
    const currentOrder = [...(path.length > 0 ? [] : []), index];
    
    keyInfo.push({ path: pathString, order: currentOrder });
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) 
    {
      const nestedInfo = extractOrderedKeys(obj[key], currentPath);
      keyInfo.push(...nestedInfo);
    }
  });
  
  return keyInfo;
}

/**
 * Gets the available locales from languages.json, excluding the default (en)
 */
function getAvailableLocales(): string[] 
{
  return languages.languages
    .filter(lang => lang.available && lang.code !== 'en')
    .map(lang => lang.code);
}

/**
 * Maps locale codes to their actual imported data
 */
function getLocaleData(code: string): LocaleData 
{
  const localeMap: Record<string, LocaleData> = {
    'es': es
  };
  
  if (!localeMap[code]) 
  {
    throw new Error(`Locale data not found for: ${code}`);
  }
  
  return localeMap[code];
}

describe('Localization Structure Validation', () => 
{
  const availableLocales = getAvailableLocales();
  const enKeys = extractKeysWithPaths(en);
  const enOrderedKeys = extractOrderedKeys(en);

  test('should have available locales to test', () => 
  {
    expect(availableLocales.length).toBeGreaterThan(0);
    expect(availableLocales).toContain('es');
  });

  // Test each available locale
  availableLocales.forEach(locale => 
  {
    describe(`${locale}.json validation`, () => 
    {
      const localeData = getLocaleData(locale);
      const localeKeys = extractKeysWithPaths(localeData);
      const localeOrderedKeys = extractOrderedKeys(localeData);

      test(`should have identical keys to en.json`, () => 
      {
        const enKeySet = new Set(enKeys);
        const localeKeySet = new Set(localeKeys);
        
        // Find missing keys (in en.json but not in locale)
        const missingKeys = enKeys.filter(key => !localeKeySet.has(key));
        
        // Find extra keys (in locale but not in en.json)
        const extraKeys = localeKeys.filter(key => !enKeySet.has(key));
        
        // Create detailed error messages
        const errors: string[] = [];
        
        if (missingKeys.length > 0) 
        {
          errors.push(`Missing keys in ${locale}.json: ${missingKeys.join(', ')}`);
        }
        
        if (extraKeys.length > 0) 
        {
          errors.push(`Extra keys in ${locale}.json: ${extraKeys.join(', ')}`);
        }
        
        if (errors.length > 0) 
        {
          throw new Error(errors.join('\n'));
        }
        
        expect(localeKeys).toEqual(expect.arrayContaining(enKeys));
        expect(enKeys).toEqual(expect.arrayContaining(localeKeys));
      });

      test(`should have identical key ordering to en.json`, () => 
      {
        // Create maps for easier comparison
        const enOrderMap = new Map(enOrderedKeys.map(item => [item.path, item.order]));
        const localeOrderMap = new Map(localeOrderedKeys.map(item => [item.path, item.order]));
        
        const orderingErrors: string[] = [];
        
        // Check each key's ordering
        enKeys.forEach(key => 
        {
          if (localeOrderMap.has(key)) 
          {
            const enOrder = enOrderMap.get(key);
            const localeOrder = localeOrderMap.get(key);
            
            // For top-level keys, compare their position
            if (key.indexOf('.') === -1) 
            { // Top-level key
              const enIndex = Object.keys(en).indexOf(key);
              const localeIndex = Object.keys(localeData).indexOf(key);
              
              if (enIndex !== localeIndex) 
              {
                orderingErrors.push(`Key "${key}" is at position ${localeIndex} in ${locale}.json but at position ${enIndex} in en.json`);
              }
            }
            else 
            {
              // For nested keys, check their position within their parent object
              const pathParts = key.split('.');
              const parentPath = pathParts.slice(0, -1).join('.');
              const keyName = pathParts[pathParts.length - 1];
              
              // Skip if keyName is undefined (shouldn't happen with valid keys)
              if (!keyName) return;
              
              // Get parent objects
              let enParent = en;
              let localeParent = localeData;
              
              pathParts.slice(0, -1).forEach(part => 
              {
                enParent = (enParent as any)[part];
                localeParent = (localeParent as any)[part];
              });
              
              if (enParent && localeParent && typeof enParent === 'object' && typeof localeParent === 'object') 
              {
                const enIndex = Object.keys(enParent).indexOf(keyName);
                const localeIndex = Object.keys(localeParent).indexOf(keyName);
                
                if (enIndex !== localeIndex) 
                {
                  orderingErrors.push(`Nested key "${key}" is at position ${localeIndex} in ${locale}.json but at position ${enIndex} in en.json`);
                }
              }
            }
          }
        });
        
        if (orderingErrors.length > 0) 
        {
          throw new Error(`Key ordering differences in ${locale}.json:\n${orderingErrors.join('\n')}`);
        }
        
        expect(orderingErrors).toEqual([]);
      });

      test(`should have all nested objects match en.json structure`, () => 
      {
        const structureErrors: string[] = [];
        
        function compareStructure(enObj: any, localeObj: any, path: string = '') 
        {
          if (typeof enObj === 'object' && enObj !== null && !Array.isArray(enObj)) 
          {
            if (typeof localeObj !== 'object' || localeObj === null || Array.isArray(localeObj)) 
            {
              structureErrors.push(`Structure mismatch at "${path}": expected object in ${locale}.json`);
              return;
            }
            
            // Compare keys at this level
            const enObjKeys = Object.keys(enObj);
            const localeObjKeys = Object.keys(localeObj);
            
            enObjKeys.forEach(key => 
            {
              const newPath = path ? `${path}.${key}` : key;
              
              if (!localeObjKeys.includes(key)) 
              {
                structureErrors.push(`Missing key "${newPath}" in ${locale}.json`);
              }
              else 
              {
                compareStructure((enObj as any)[key], (localeObj as any)[key], newPath);
              }
            });
            
            // Check for extra keys in locale
            localeObjKeys.forEach(key => 
            {
              if (!enObjKeys.includes(key)) 
              {
                const newPath = path ? `${path}.${key}` : key;
                structureErrors.push(`Extra key "${newPath}" in ${locale}.json`);
              }
            });
          }
        }
        
        compareStructure(en, localeData);
        
        if (structureErrors.length > 0) 
        {
          throw new Error(`Structure differences in ${locale}.json:\n${structureErrors.join('\n')}`);
        }
        
        expect(structureErrors).toEqual([]);
      });
    });
  });

  test('en.json should be properly structured (baseline test)', () => 
  {
    expect(typeof en).toBe('object');
    expect(en).not.toBe(null);
    expect(Array.isArray(en)).toBe(false);
    expect(Object.keys(en).length).toBeGreaterThan(0);
  });
});

describe('Localization Content Validation', () => 
{
  const availableLocales = getAvailableLocales();

  availableLocales.forEach(locale => 
  {
    test(`${locale}.json should not have empty string values`, () => 
    {
      const localeData = getLocaleData(locale);
      const emptyValues: string[] = [];
      
      function checkForEmptyValues(obj: any, path: string = '') 
      {
        for (const key in obj) 
        {
          const currentPath = path ? `${path}.${key}` : key;
          const value = (obj as any)[key];
          
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
      
      checkForEmptyValues(localeData);
      
      if (emptyValues.length > 0) 
      {
        throw new Error(`Empty string values found in ${locale}.json: ${emptyValues.join(', ')}`);
      }
      
      expect(emptyValues).toEqual([]);
    });
  });
});