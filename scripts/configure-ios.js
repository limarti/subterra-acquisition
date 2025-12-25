#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static iOS configuration values
const IOS_CONFIG = {
  // iOS 15.0 minimum required by Capacitor 8+
  // See: https://capacitorjs.com/docs/updating/8-0
  deploymentTarget: '15.0',
};

// Bluetooth permissions configuration
const BLUETOOTH_PERMISSIONS = {
  // iOS 13+ Bluetooth permission (replaces NSBluetoothPeripheralUsageDescription)
  NSBluetoothAlwaysUsageDescription: 'Uses Bluetooth to scan for, connect to, and configure sensors via BLE.',
  // Legacy permission for iOS 12 and below (kept for backward compatibility)
  NSBluetoothPeripheralUsageDescription: 'Need BLE permission for Bluetooth configuration of sensors',
  // Location permissions (required for BLE scanning on iOS)
  NSLocationAlwaysAndWhenInUseUsageDescription: 'Need Location permission for Bluetooth configuration of sensors',
  NSLocationAlwaysUsageDescription: 'Need Location permission for Bluetooth configuration of sensors',
  NSLocationWhenInUseUsageDescription: 'Need Location permission for Bluetooth configuration of sensors',
};

// Allows the app to continue using Core Bluetooth while in the background
const BLUETOOTH_BACKGROUND_MODES = ['bluetooth-central'];

const PBXPROJ_PATH = path.join(__dirname, '../ios/App/App.xcodeproj/project.pbxproj');
const INFO_PLIST_PATH = path.join(__dirname, '../ios/App/App/Info.plist');

function updateiOSDeploymentTarget()
{
  if (!fs.existsSync(PBXPROJ_PATH))
  {
    console.log('iOS project.pbxproj not found. Skipping iOS configuration (platform not initialized).');
    return false;
  }

  try
  {
    let pbxproj = fs.readFileSync(PBXPROJ_PATH, 'utf8');

    // More targeted approach: Find App target configurations specifically
    // Look for the App target section and update only its deployment targets
    const appTargetMatch = pbxproj.match(/\/\* App \*\/ = \{[^}]*isa = PBXNativeTarget;[^}]*name = App;[^}]*\};/);

    if (!appTargetMatch)
    {
      console.log('Could not find App target in project file');
      return false;
    }

    // Update IPHONEOS_DEPLOYMENT_TARGET in build configuration sections
    // This is safer than a global replace - targets specific build configs
    const buildConfigRegex = /(\w+) \/\* (Debug|Release) \*\/ = \{[^}]*IPHONEOS_DEPLOYMENT_TARGET = [^;]+;[^}]*\};/g;

    let updated = false;
    pbxproj = pbxproj.replace(buildConfigRegex, (match) =>
    {
      if (match.includes('IPHONEOS_DEPLOYMENT_TARGET'))
      {
        updated = true;
        return match.replace(
          /IPHONEOS_DEPLOYMENT_TARGET = [^;]+;/,
          `IPHONEOS_DEPLOYMENT_TARGET = ${IOS_CONFIG.deploymentTarget};`
        );
      }
      return match;
    });

    if (updated)
    {
      fs.writeFileSync(PBXPROJ_PATH, pbxproj);
      console.log(`Updated iOS deployment target to ${IOS_CONFIG.deploymentTarget}`);
      return true;
    }
    else
    {
      console.log('No deployment target configurations found to update');
      return false;
    }
  }
  catch (error)
  {
    console.error('Error updating iOS project.pbxproj:', error.message);
    return false;
  }
}

function updateInfoPlistWithBluetoothPermissions()
{
  if (!fs.existsSync(INFO_PLIST_PATH))
  {
    console.log('Info.plist not found. Skipping Bluetooth permissions configuration (platform not initialized).');
    return false;
  }

  try
  {
    let plistContent = fs.readFileSync(INFO_PLIST_PATH, 'utf8');

    let modificationsCount = 0;

    // Find the main <dict> section (first dict after <plist>)
    const plistDictMatch = plistContent.match(/(<plist[^>]*>\s*<dict>)([\s\S]*?)(<\/dict>\s*<\/plist>)/);
    if (!plistDictMatch)
    {
      console.log('Could not find main <dict> section in Info.plist');
      return false;
    }

    const plistStart = plistDictMatch[1];
    let dictContent = plistDictMatch[2];
    const plistEnd = plistDictMatch[3];

    // Add or update Bluetooth and Location permissions
    for (const [key, value] of Object.entries(BLUETOOTH_PERMISSIONS))
    {
      // Check if the key already exists
      const keyRegex = new RegExp(`<key>${key}</key>\\s*<string>[^<]*</string>`, 'i');

      if (keyRegex.test(dictContent))
      {
        // Update existing key if value is different
        const currentValue = dictContent.match(new RegExp(`<key>${key}</key>\\s*<string>([^<]*)</string>`, 'i'));
        if (currentValue && currentValue[1] !== value)
        {
          dictContent = dictContent.replace(
            keyRegex,
            `<key>${key}</key>\n\t<string>${value}</string>`
          );
          modificationsCount++;
        }
      }
      else
      {
        // Add new key-value pair before the closing </dict>
        dictContent = dictContent.trim() + `\n\t<key>${key}</key>\n\t<string>${value}</string>\n`;
        modificationsCount++;
      }
    }

    // Handle UIBackgroundModes array
    if (!dictContent.includes('<key>UIBackgroundModes</key>'))
    {
      // Add UIBackgroundModes array with bluetooth-central
      const backgroundModesArray = `\t<key>UIBackgroundModes</key>\n\t<array>\n\t\t<string>bluetooth-central</string>\n\t</array>\n`;
      dictContent = dictContent.trim() + '\n' + backgroundModesArray;
      modificationsCount++;
    }
    else
    {
      // Check if bluetooth-central is already in the array
      const backgroundModesMatch = dictContent.match(/<key>UIBackgroundModes<\/key>\s*<array>([\s\S]*?)<\/array>/i);
      if (backgroundModesMatch)
      {
        const arrayContent = backgroundModesMatch[1];
        if (!arrayContent.includes('bluetooth-central'))
        {
          // Add bluetooth-central to existing array
          dictContent = dictContent.replace(
            /(<key>UIBackgroundModes<\/key>\s*<array>)([\s\S]*?)(<\/array>)/i,
            `$1$2\t\t<string>bluetooth-central</string>\n\t$3`
          );
          modificationsCount++;
        }
      }
    }

    if (modificationsCount > 0)
    {
      // Reconstruct the plist file
      const updatedPlist = plistStart + '\n' + dictContent + plistEnd;

      // Write the updated content
      fs.writeFileSync(INFO_PLIST_PATH, updatedPlist);

      // Verify the write was successful
      const verifyContent = fs.readFileSync(INFO_PLIST_PATH, 'utf8');
      if (!verifyContent.includes('NSBluetoothAlwaysUsageDescription'))
      {
        throw new Error('Failed to verify Bluetooth permissions were written to Info.plist');
      }

      console.log(`Added/updated ${modificationsCount} Bluetooth and Location permission(s) in Info.plist`);
      return true;
    }
    else
    {
      console.log('All Bluetooth permissions already configured in Info.plist');
      return true;
    }
  }
  catch (error)
  {
    console.error('Error updating Info.plist:', error.message);
    return false;
  }
}

function main()
{
  console.log('Configuring iOS app settings...');

  const deploymentTargetSuccess = updateiOSDeploymentTarget();
  const infoPlistSuccess = updateInfoPlistWithBluetoothPermissions();

  if (deploymentTargetSuccess && infoPlistSuccess)
  {
    console.log('iOS configuration completed successfully!');
    console.log('\nApplied settings:');
    console.log(`   - iOS deployment target: ${IOS_CONFIG.deploymentTarget}`);
    console.log('   - Bluetooth permissions: Configured for SPP and BLE communication');
    console.log('   - Location permissions: Configured (required for BLE scanning)');
    console.log('   - Background modes: bluetooth-central enabled');
  }
  else if (!deploymentTargetSuccess && !infoPlistSuccess)
  {
    console.log('iOS platform not initialized. Configuration will be applied when platform is added.');
  }
  else
  {
    console.log('Some configurations may not have been applied.');
    process.exit(1);
  }
}

main();
