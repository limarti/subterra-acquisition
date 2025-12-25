import { existsSync, readFileSync, rmSync } from 'fs';
import { execSync } from 'child_process';

const androidPath = './android';
const gradlePath = './android/app/build.gradle';
const capacitorConfigPath = './capacitor.config.ts';

function getAppIdFromGradle()
{
  if (!existsSync(gradlePath)) return null;
  const content = readFileSync(gradlePath, 'utf-8');
  const match = content.match(/applicationId\s+["']([^"']+)["']/);
  return match ? match[1] : null;
}

function getAppIdFromConfig()
{
  const content = readFileSync(capacitorConfigPath, 'utf-8');
  const match = content.match(/appId:\s*['"]([^'"]+)['"]/);
  return match ? match[1] : null;
}

const currentAppId = getAppIdFromGradle();
const configAppId = getAppIdFromConfig();

if (existsSync(androidPath) && currentAppId && configAppId && currentAppId !== configAppId)
{
  console.log(`App ID changed: ${currentAppId} → ${configAppId}`);
  console.log('Removing old Android platform...');
  rmSync(androidPath, { recursive: true, force: true });
}

if (!existsSync(androidPath))
{
  console.log('Adding Android platform...');
  execSync('npx cap add android', { stdio: 'inherit' });
}
else
{
  console.log('Android platform already exists.');
}
