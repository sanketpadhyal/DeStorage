const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // 1. Remove ModuleScopePlugin to allow importing from root folders outside src/
      webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
        (plugin) => plugin.constructor.name !== 'ModuleScopePlugin'
      );

      // 2. Add root module folders to babel-loader include rule
      const oneOfRule = webpackConfig.module.rules.find((rule) => rule.oneOf);
      if (oneOfRule) {
        const babelLoader = oneOfRule.oneOf.find(
          (rule) => rule.loader && rule.loader.includes('babel-loader')
        );
        if (babelLoader) {
          const rootFolders = [
            path.resolve(__dirname, 'vault'),
            path.resolve(__dirname, 'landingpage'),
            path.resolve(__dirname, 'web3'),
            path.resolve(__dirname, 'crypto'),
            path.resolve(__dirname, 'ipfs'),
            path.resolve(__dirname, 'types'),
            path.resolve(__dirname, 'utils'),
            path.resolve(__dirname, 'config'),
            path.resolve(__dirname, 'etc'),
            path.resolve(__dirname, 'src'),
          ];
          babelLoader.include = rootFolders;
        }
      }

      return webpackConfig;
    },
  },
};
