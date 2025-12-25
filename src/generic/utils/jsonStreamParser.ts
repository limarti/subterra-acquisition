/**
 * Utility for parsing JSON objects from a streaming buffer
 * Handles partial JSON objects and extracts complete ones
 */

// Core interface
export interface JsonStreamResult
{
  jsonObjects: Record<string, unknown>[];
  remainingBuffer: string;
}

// Type guards for runtime validation
function isValidJsonObject(obj: unknown): obj is Record<string, unknown>
{
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

/**
 * Parses complete JSON objects from a buffer that may contain partial JSON
 * Handles proper brace counting, string detection, and escape sequences
 * Protects against buffer overflow by limiting maximum buffer size
 * 
 * @param buffer - The buffer containing potentially multiple JSON objects
 * @returns Object with array of parsed JSON objects and remaining buffer
 * @throws TypeError if buffer is not a string
 */
export function parseJsonStream(buffer: string): JsonStreamResult
{
  const MAX_BUFFER_SIZE = 200 * 1024;
  const jsonObjects: Record<string, unknown>[] = [];
  let remainingBuffer = buffer;

  if (remainingBuffer.length > MAX_BUFFER_SIZE)
  {
    console.warn(`🚨 Buffer overflow detected (${remainingBuffer.length} bytes), applying reduction strategy`);
    
    const tempResult = tryParseCompleteObjects(remainingBuffer);
    if (tempResult.jsonObjects.length > 0)
    {
      jsonObjects.push(...tempResult.jsonObjects);
      remainingBuffer = tempResult.remainingBuffer;
      console.log(`📉 Buffer reduced to ${remainingBuffer.length} bytes after parsing ${tempResult.jsonObjects.length} objects`);
    }
    
    if (remainingBuffer.length > MAX_BUFFER_SIZE)
    {
      console.warn(`⚠️ Emergency truncation: keeping second half of buffer`);
      remainingBuffer = remainingBuffer.slice(-MAX_BUFFER_SIZE / 2);
    }
  }

  if (!remainingBuffer.startsWith('{'))
  {
    let cleanupIndex = remainingBuffer.indexOf('}{');
    if (cleanupIndex !== -1)
    {
      const discarded = remainingBuffer.substring(0, cleanupIndex + 1);
      console.warn('🗑️ parseJsonStream: Discarding corrupted data at beginning (}{pattern):', discarded.substring(0, 50) + '...');
      remainingBuffer = remainingBuffer.substring(cleanupIndex + 1);
    }
    else
    {
      const firstBraceIndex = remainingBuffer.indexOf('{');
      if (firstBraceIndex !== -1)
      {
        const discarded = remainingBuffer.substring(0, firstBraceIndex);
        console.warn('🗑️ parseJsonStream: Discarding corrupted data at beginning (prefix):', discarded.substring(0, 50) + '...');
        remainingBuffer = remainingBuffer.substring(firstBraceIndex);
      }
    }
  }

  const parseResult = tryParseCompleteObjects(remainingBuffer);
  jsonObjects.push(...parseResult.jsonObjects);

  return {
    jsonObjects,
    remainingBuffer: parseResult.remainingBuffer
  };
}

function tryParseCompleteObjects(buffer: string): JsonStreamResult
{
  const jsonObjects: Record<string, unknown>[] = [];
  let remainingBuffer = buffer;

  const hasCompletePattern = buffer.includes('}{');
  const endsWithBrace = buffer.endsWith('}');
  const startsWithBrace = buffer.startsWith('{');

  if (!hasCompletePattern && !endsWithBrace)
  {
    if (buffer.includes('{') && buffer.includes('}'))
    {
      const extractedCount = extractEmbeddedJson(buffer, jsonObjects);
      if (extractedCount > 0)
      {
        return { jsonObjects, remainingBuffer: '' };
      }
    }
    
    return { jsonObjects: [], remainingBuffer: buffer };
  }

  const boundaries: number[] = [];
  let searchIndex = 0;
  
  while (searchIndex < buffer.length)
  {
    const foundIndex = buffer.indexOf('}{', searchIndex);
    if (foundIndex === -1) break;
    boundaries.push(foundIndex);
    searchIndex = foundIndex + 1;
  }

  let currentIndex = 0;
  
  if (startsWithBrace)
  {
    for (const boundaryIndex of boundaries)
    {
      const jsonStr = buffer.substring(currentIndex, boundaryIndex + 1);
      if (tryParseAndAdd(jsonStr, jsonObjects))
      {
        currentIndex = boundaryIndex + 1;
      }
      else
      {
        currentIndex = boundaryIndex + 1;
      }
    }

    if (endsWithBrace && currentIndex < buffer.length)
    {
      const finalJsonStr = buffer.substring(currentIndex);
      if (tryParseAndAdd(finalJsonStr, jsonObjects))
      {
        currentIndex = buffer.length;
      }
    }
  }

  remainingBuffer = buffer.substring(currentIndex);

  return { jsonObjects, remainingBuffer };
}

function tryParseAndAdd(jsonStr: string, jsonObjects: Record<string, unknown>[]): boolean
{
  try
  {
    const parsedObject = JSON.parse(jsonStr) as unknown;
    
    if (isValidJsonObject(parsedObject)) 
    {
      jsonObjects.push(parsedObject);
      return true;
    }
    else 
    {
      console.warn('🗑️ parseJsonStream: Parsed value is not a JSON object:', typeof parsedObject);
      return false;
    }
  }
  catch (error)
  {
    if (jsonStr.includes('{') && jsonStr.endsWith('}'))
    {
      console.warn('🔍 parseJsonStream: Main parsing failed, trying embedded JSON extraction...');
      const extractedCount = extractEmbeddedJson(jsonStr, jsonObjects);
      if (extractedCount > 0)
        return true;
    }
    
    console.warn('🗑️ parseJsonStream: Failed to parse JSON, discarding as corrupted:', jsonStr.substring(0, 50) + '...', error);
    return false;
  }
}

function extractEmbeddedJson(
  corruptedStr: string, 
  jsonObjects: Record<string, unknown>[]
): number
{
  let extractedCount = 0;
  
  // Strategy: Look for all {...} patterns and try to parse each one individually
  // This handles cases where valid JSON is nested within corrupted structures
  
  let i = 0;
  while (i < corruptedStr.length)
  {
    const openBraceIndex = corruptedStr.indexOf('{', i);
    if (openBraceIndex === -1) break;
    
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    let closeBraceIndex = -1;
    
    for (let j = openBraceIndex; j < corruptedStr.length; j++)
    {
      const char = corruptedStr[j];
      
      if (escapeNext)
      {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\')
      {
        escapeNext = true;
        continue;
      }
      
      if (char === '"')
      {
        inString = !inString;
        continue;
      }
      
      if (!inString)
      {
        if (char === '{')
        {
          braceCount++;
        }
        else if (char === '}')
        {
          braceCount--;
          if (braceCount === 0)
          {
            closeBraceIndex = j;
            break;
          }
        }
      }
    }
    
    if (closeBraceIndex !== -1)
    {
      const candidateJson = corruptedStr.substring(openBraceIndex, closeBraceIndex + 1);
      
      try
      {
        const parsedObject = JSON.parse(candidateJson) as unknown;
        
        if (isValidJsonObject(parsedObject)) 
        {
          jsonObjects.push(parsedObject);
          extractedCount++;
          
          i = closeBraceIndex + 1;
        }
        else 
        {
          i = openBraceIndex + 1;
        }
      }
      catch (parseError)
      {
        i = openBraceIndex + 1;
      }
    }
    else
    {
      i = openBraceIndex + 1;
    }
  }
  
  return extractedCount;
}