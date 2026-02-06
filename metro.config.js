// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude the backend directory from the Metro bundler
config.resolver.blockList = [
  /\/backend\/.*/,
  /\/backend\/node_modules\/.*/,
];

module.exports = config;