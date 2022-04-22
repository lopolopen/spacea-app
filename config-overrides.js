const { override, addDecoratorsLegacy, fixBabelImports, addLessLoader } = require('customize-cra');

module.exports = override(
  addDecoratorsLegacy(),
  fixBabelImports('import', {
    libraryName: 'antd',
    libraryDirectory: 'es',
    style: true,
  }),
  addLessLoader({
    javascriptEnabled: true
  })
);
