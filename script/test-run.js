// Currently jest does not support native ES module load (https://github.com/facebook/jest/issues/9885)
// and it throws 'module not found' error if import statement has extension.
// So we need to eliminate extension before it resolves module's path.

const Runtime = require('jest-runtime');
const org = Runtime.prototype.requireModuleOrMock;
Runtime.prototype.requireModuleOrMock = function(from, moduleName) {
  if (/\.\/util\.js/.test(moduleName)) {
    moduleName = moduleName.replace('.js','');
  }
  return org.call(this, from, moduleName);
}
require('jest').run();
