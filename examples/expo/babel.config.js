// @IMPORTANT: This is needed for the workspace package to be imported correctly
// It can be removed if the workspace package is not used
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@forward-software/react-auth': '../../lib',
          },
        },
      ],
    ],
  };
};
