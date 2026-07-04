import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.omiqora.app',
  appName: 'OMIQORA',
  webDir: 'www',
  server: {
    url: 'https://omiqora.vercel.app',
    cleartext: false
  }
};

export default config;