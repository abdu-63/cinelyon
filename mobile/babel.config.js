module.exports = function (api) {
  api.cache.never();
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@app': './app',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
