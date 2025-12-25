import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';

describe('Post-build verification', () =>
{
  it('should not contain any PNG or JPG files in dist folder', () =>
  {
    // Find the project root by looking for package.json
    let projectRoot = __dirname;
    while (!existsSync(join(projectRoot, 'package.json')) && projectRoot !== '/')
    {
      projectRoot = resolve(projectRoot, '..');
    }
    
    const distPath = resolve(projectRoot, 'dist');
    
    if (!existsSync(distPath))
    {
      throw new Error(`Dist folder does not exist at ${distPath}. Make sure the build completed successfully before running post-build tests.`);
    }

    const imageFiles: string[] = [];
    
    function checkDirectory(dirPath: string): void
    {
      const files = readdirSync(dirPath);
      
      for (const file of files)
      {
        const fullPath = join(dirPath, file);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory())
        {
          checkDirectory(fullPath);
        }
        else if (/\.(png|jpg|jpeg)$/i.test(file))
        {
          imageFiles.push(fullPath.replace(distPath, ''));
        }
      }
    }
    
    checkDirectory(distPath);
    
    if (imageFiles.length > 0)
    {
      throw new Error(`Build contains PNG/JPG files which break iframe preview on dashboard: ${imageFiles.join(', ')}`);
    }
    
    expect(imageFiles).toEqual([]);
  });
});