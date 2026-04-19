const { registerBuiltin } = require('./registry');
const { bashTool } = require('./bash');
const { readTool } = require('./read');
const { writeTool } = require('./write');
const { globTool } = require('./glob');
const { grepTool } = require('./grep');
const { questionTool } = require('./question');
const { todoTool } = require('./todo');

registerBuiltin(bashTool);
registerBuiltin(readTool);
registerBuiltin(writeTool);
registerBuiltin(globTool);
registerBuiltin(grepTool);
registerBuiltin(questionTool);
registerBuiltin(todoTool);

const { getBuiltinTools } = require('./registry');

module.exports = {
  getBuiltinTools,
};
