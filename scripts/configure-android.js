#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static Android configuration values
const ANDROID_CONFIG = {
  appCategory: 'android.intent.category.PRODUCTIVITY', // Tools category
  screenOrientation: 'sensor', // Follow device orientation
  minSdkVersion: 25,
};

// Bluetooth permissions required for SPP and BLE communication
const BLUETOOTH_PERMISSIONS = [
  // Legacy Bluetooth permissions (for Android 11 and below)
  '<uses-permission android:name="android.permission.BLUETOOTH" />',
  '<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />',
  // Android 12+ Bluetooth permissions
  '<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />',
  '<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />',
  // Location permission (required for BLE scanning on Android 11 and below)
  '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
];

// Bluetooth feature declarations
const BLUETOOTH_FEATURES = [
  '<uses-feature android:name="android.hardware.bluetooth" android:required="false" />',
  '<uses-feature android:name="android.hardware.bluetooth_le" android:required="false" />',
];

// Function to get appId from capacitor.config.ts
function getAppId()
{
  const configPath = path.join(__dirname, '../capacitor.config.ts');

  try
  {
    const content = fs.readFileSync(configPath, 'utf8');
    const match = content.match(/appId:\s*['"]([^'"]+)['"]/);

    return match ? match[1] : '';
  }
  catch (error)
  {
    console.error('Error reading capacitor.config.ts:', error.message);
    return '';
  }
};

// Convert appId (com.geolitix.gssi.gla) to path (com/geolitix/gssi/gla)
function getMainActivityPath()
{
  const appId = getAppId();
  const packagePath = appId.replace(/\./g, '/');
  return path.join(__dirname, `../android/app/src/main/java/${packagePath}/MainActivity.java`);
}

const MANIFEST_PATH = path.join(__dirname, '../android/app/src/main/AndroidManifest.xml');
const VARIABLES_PATH = path.join(__dirname, '../android/variables.gradle');
const BUILD_GRADLE_PATH = path.join(__dirname, '../android/build.gradle');
const APP_BUILD_GRADLE_PATH = path.join(__dirname, '../android/app/build.gradle');
const MAIN_ACTIVITY_PATH = getMainActivityPath();

function updateAndroidManifest()
{
  if (!fs.existsSync(MANIFEST_PATH))
  {
    console.log('AndroidManifest.xml not found. Skipping Android configuration (platform not initialized).');
    return false;
  }

  try
  {
    let manifest = fs.readFileSync(MANIFEST_PATH, 'utf8');

    // Add app category as meta-data if not present
    if (!manifest.includes('android.app.category'))
    {
      manifest = manifest.replace(
        /<\/activity>/,
        `            <meta-data android:name="android.app.category" android:value="${ANDROID_CONFIG.appCategory}" />\n        </activity>`
      );
      console.log('Added app category: Tools');
    }

    // Set screen orientation if not present or different
    if (manifest.includes('android:screenOrientation'))
    {
      manifest = manifest.replace(
        /android:screenOrientation="[^"]*"/,
        `android:screenOrientation="${ANDROID_CONFIG.screenOrientation}"`
      );
      console.log('Updated screen orientation: sensor (follows device)');
    }
    else
    {
      manifest = manifest.replace(
        /<activity([^>]*android:name="\.MainActivity"[^>]*)/,
        `<activity$1\n            android:screenOrientation="${ANDROID_CONFIG.screenOrientation}"`
      );
      console.log('Added screen orientation: sensor (follows device)');
    }

    // Add Bluetooth permissions if not present
    let addedPermissions = 0;
    for (const permission of BLUETOOTH_PERMISSIONS)
    {
      if (!manifest.includes(permission))
      {
        // Insert permissions after the <manifest> opening tag
        manifest = manifest.replace(
          /(<manifest[^>]*>)/,
          `$1\n    ${permission}`
        );
        addedPermissions++;
      }
    }
    if (addedPermissions > 0)
    {
      console.log(`Added ${addedPermissions} Bluetooth permission(s)`);
    }

    // Add Bluetooth features if not present
    let addedFeatures = 0;
    for (const feature of BLUETOOTH_FEATURES)
    {
      if (!manifest.includes(feature))
      {
        // Insert features before the closing </manifest> tag
        manifest = manifest.replace(
          /(<\/manifest>)/,
          `    ${feature}\n$1`
        );
        addedFeatures++;
      }
    }
    if (addedFeatures > 0)
    {
      console.log(`Added ${addedFeatures} Bluetooth feature(s)`);
    }

    fs.writeFileSync(MANIFEST_PATH, manifest);
    return true;
  }
  catch (error)
  {
    console.error('Error updating AndroidManifest.xml:', error.message);
    return false;
  }
}

function updateVariablesGradle()
{
  if (!fs.existsSync(VARIABLES_PATH))
  {
    console.log('variables.gradle not found. Skipping Android configuration (platform not initialized).');
    return false;
  }

  try
  {
    let variables = fs.readFileSync(VARIABLES_PATH, 'utf8');

    // Update minSdkVersion
    if (variables.includes('minSdkVersion ='))
    {
      variables = variables.replace(
        /minSdkVersion = \d+/,
        `minSdkVersion = ${ANDROID_CONFIG.minSdkVersion}`
      );
      console.log(`Updated minSdkVersion to ${ANDROID_CONFIG.minSdkVersion}`);
    }

    fs.writeFileSync(VARIABLES_PATH, variables);
    return true;
  }
  catch (error)
  {
    console.error('Error updating variables.gradle:', error.message);
    return false;
  }
}

function updateAppBuildGradle()
{
  if (!fs.existsSync(APP_BUILD_GRADLE_PATH))
  {
    console.log('app/build.gradle not found. Skipping version configuration.');
    return false;
  }

  try
  {
    let buildGradle = fs.readFileSync(APP_BUILD_GRADLE_PATH, 'utf8');

    // Replace hardcoded versionCode with project property support
    buildGradle = buildGradle.replace(
      /versionCode \d+/,
      "versionCode project.hasProperty('versionCode') ? project.property('versionCode').toInteger() : 1"
    );

    // Replace hardcoded versionName with project property support
    buildGradle = buildGradle.replace(
      /versionName "[^"]*"/,
      'versionName project.hasProperty(\'versionName\') ? project.property(\'versionName\') : "1.0"'
    );

    // Add signing configuration if not present
    if (!buildGradle.includes('signingConfigs'))
    {
      // Find the position right after the defaultConfig block closes
      const insertPosition = buildGradle.indexOf('    }', buildGradle.indexOf('defaultConfig')) + 6; // After closing brace and newline

      const signingConfigBlock = `    signingConfigs {
        debug {
            storeFile file('debug-keystore.jks')
            storePassword 'android'
            keyAlias 'debug-key'
            keyPassword 'android'
        }
        release {
            if (file(project.hasProperty('uploadStoreFile') ? project.property('uploadStoreFile') : 'upload-keystore.jks').exists()) {
                storeFile file(project.hasProperty('uploadStoreFile') ? project.property('uploadStoreFile') : 'upload-keystore.jks')
                storePassword project.hasProperty('uploadStorePassword') ? project.property('uploadStorePassword') : System.getenv('UPLOAD_KEYSTORE_PASSWORD')
                keyAlias project.hasProperty('uploadKeyAlias') ? project.property('uploadKeyAlias') : System.getenv('UPLOAD_KEY_ALIAS')
                keyPassword project.hasProperty('uploadKeyPassword') ? project.property('uploadKeyPassword') : System.getenv('UPLOAD_KEY_PASSWORD')
            }
        }
    }
`;
      
      // Insert signing configuration
      buildGradle = buildGradle.slice(0, insertPosition) + signingConfigBlock + buildGradle.slice(insertPosition);
      
      // Replace the entire buildTypes section with corrected structure
      const buildTypesStart = buildGradle.indexOf('buildTypes {');
      let buildTypesEnd = buildTypesStart;
      let braceCount = 0;
      let i = buildTypesStart + 'buildTypes {'.length;
      
      // Find the matching closing brace for buildTypes
      while (i < buildGradle.length) 
      {
        if (buildGradle[i] === '{') braceCount++;
        if (buildGradle[i] === '}') 
        {
          if (braceCount === 0) 
          {
            buildTypesEnd = i + 1;
            break;
          }
          braceCount--;
        }
        i++;
      }
      
      // Skip any trailing whitespace/newlines after the closing brace
      while (buildTypesEnd < buildGradle.length && /\s/.test(buildGradle[buildTypesEnd])) 
      {
        buildTypesEnd++;
      }
      
      const correctedBuildTypes = `buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
`;
      
      // Replace the entire buildTypes section
      buildGradle = buildGradle.slice(0, buildTypesStart) + correctedBuildTypes + buildGradle.slice(buildTypesEnd);
      
      console.log('Added signing configuration and corrected buildTypes structure');
    }

    fs.writeFileSync(APP_BUILD_GRADLE_PATH, buildGradle);
    console.log('Updated app/build.gradle to support CI version parameters and signing');
    return true;
  }
  catch (error)
  {
    console.error('Error updating app/build.gradle:', error.message);
    return false;
  }
}

function copyBuildConfiguration()
{
  const sourceBuildGradle = path.join(__dirname, '../build-config/android/build.gradle');
  const sourceVariablesGradle = path.join(__dirname, '../build-config/android/variables.gradle');
  
  if (!fs.existsSync(BUILD_GRADLE_PATH))
  {
    console.log('Android build.gradle not found. Skipping build configuration (platform not initialized).');
    return false;
  }

  try
  {
    // Copy build configuration files
    if (fs.existsSync(sourceBuildGradle))
    {
      fs.copyFileSync(sourceBuildGradle, BUILD_GRADLE_PATH);
      console.log('Applied build-config build.gradle');
    }
    
    if (fs.existsSync(sourceVariablesGradle))
    {
      fs.copyFileSync(sourceVariablesGradle, VARIABLES_PATH);
      console.log('Applied build-config variables.gradle with version support');
    }

    return true;
  }
  catch (error)
  {
    console.error('Error copying build configuration:', error.message);
    return false;
  }
}

function updateMainActivity()
{
  if (!fs.existsSync(MAIN_ACTIVITY_PATH))
  {
    console.log('MainActivity.java not found. Skipping MainActivity configuration (platform not initialized).');
    return false;
  }

  // Required imports for hiding navigation bar
  const REQUIRED_IMPORTS = [
    'import android.os.Bundle;',
    'import android.view.View;'
  ];

  // Class body content to add navigation bar hiding functionality
  const CLASS_BODY_CONTENT = `
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        hideNavBar();
    }

    private void hideNavBar() {
        final View decorView = getWindow().getDecorView();

        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
          | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
          | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
          | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
          | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        );

        decorView.setOnSystemUiVisibilityChangeListener(visibility -> {
            hideNavBar();
        });
    }
  `;

  try
  {
    let mainActivity = fs.readFileSync(MAIN_ACTIVITY_PATH, 'utf8');

    // Check if already configured
    if (mainActivity.includes('hideNavBar'))
    {
      console.log('MainActivity already configured to hide navigation bar');
      return true;
    }

    // Add required imports
    let addedImports = 0;
    const appId = getAppId();
    // Create dynamic regex for package declaration
    const packageRegex = new RegExp(`(package ${appId.replace(/\./g, '\\.')};)`);

    for (const importStatement of REQUIRED_IMPORTS)
    {
      if (!mainActivity.includes(importStatement))
      {
        // Insert import after the package declaration
        mainActivity = mainActivity.replace(
          packageRegex,
          `$1\n${importStatement}`
        );
        addedImports++;
      }
    }

    // Replace empty class body with navigation bar hiding logic
    mainActivity = mainActivity.replace(
      /public class MainActivity extends BridgeActivity \{\}/,
      `public class MainActivity extends BridgeActivity {\n${CLASS_BODY_CONTENT}\n}`
    );

    fs.writeFileSync(MAIN_ACTIVITY_PATH, mainActivity);
    console.log(`Updated MainActivity.java (added ${addedImports} imports and navigation bar hiding logic)`);
    return true;
  }
  catch (error)
  {
    console.error('Error updating MainActivity.java:', error.message);
    return false;
  }
}

function main()
{
  console.log('Configuring Android app settings...');

  const manifestSuccess = updateAndroidManifest();
  const variablesSuccess = updateVariablesGradle();
  const buildConfigSuccess = copyBuildConfiguration();
  const appBuildGradleSuccess = updateAppBuildGradle();
  const mainActivitySuccess = updateMainActivity();

  if (manifestSuccess && variablesSuccess && buildConfigSuccess && appBuildGradleSuccess && mainActivitySuccess)
  {
    console.log('Android configuration completed successfully!');
    console.log('\nApplied settings:');
    console.log(`   • App category: Tools (${ANDROID_CONFIG.appCategory})`);
    console.log(`   • Screen orientation: ${ANDROID_CONFIG.screenOrientation}`);
    console.log(`   • Minimum SDK: ${ANDROID_CONFIG.minSdkVersion}`);
    console.log('   • Version handling: Enabled (CI will set versionCode/versionName)');
    console.log('   • Bluetooth permissions: Configured for SPP and BLE communication');
    console.log('   • Navigation bar: Hidden (status bar remains visible)');
  }
  else if (!manifestSuccess && !variablesSuccess && !buildConfigSuccess && !appBuildGradleSuccess && !mainActivitySuccess)
  {
    console.log('Android platform not initialized. Configuration will be applied when platform is added.');
  }
  else
  {
    console.log('Some configurations may not have been applied.');
    process.exit(1);
  }
}

main();
