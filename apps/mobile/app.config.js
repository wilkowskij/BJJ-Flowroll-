/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: process.env.GYM_NAME ?? 'FlowMat',
    slug: 'flowmat-mobile',
    version: '0.1.0',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    backgroundColor: '#0F172A',
    splash: {
      backgroundColor: '#0F172A',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.flowmat.mobile',
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#0F172A',
      },
      package: 'com.flowmat.mobile',
    },
    web: {
      bundler: 'metro',
      output: 'static',
    },
    plugins: ['expo-router'],
    scheme: 'flowmat',
    experiments: {
      typedRoutes: true,
    },
    extra: {
      gymPrimaryColor: process.env.GYM_PRIMARY_COLOR ?? '#1B4FD8',
      gymSecondaryColor: process.env.GYM_SECONDARY_COLOR ?? '#F59E0B',
      gymLogoUrl: process.env.GYM_LOGO_URL ?? null,
      apiBaseUrl: process.env.API_BASE_URL ?? 'https://api.flowmat.app',
    },
  },
};
