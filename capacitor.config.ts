import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.geolitix.gssi.gla',
  appName: 'GLA',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 500,
      backgroundColor: '#1E4767',
      androidScaleType: 'CENTER_CROP',
    }
  },
};

export default config;
