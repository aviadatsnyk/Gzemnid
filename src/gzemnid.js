'use strict';

const configManager = require('./config');

const commands = {
  ast: require('./commands/ast'),
  code: require('./commands/code'),
  server: require('./commands/server'),
  fetch: require('./commands/fetch'),
  meta: require('./commands/meta'),
  depsdb: require('./commands/depsdb'),
  stats: require('./commands/stats'),
  extract: require('./commands/extract'),
  packages: require('./commands/packages')
};

async function main(argv) {
  await configManager.load();
  argv.shift();
  if (argv.length > 0 && argv[0].endsWith('gzemnid.js')) {
    argv.shift();
  }
  if (argv.length === 0) {
    throw new Error('No command specified!');
  }
  const command = argv.shift();
  if (!commands.hasOwnProperty(command)) {
    throw new Error(`No such command: ${command}.`);
  }
  const method = argv.length > 0 ? argv.shift() : 'run';
  if (!commands[command][method]) {
    throw new Error(`No such method of command ${command}: ${method}.`);
  }
  commands[command][method](...argv);
}

main(process.argv).catch(e => console.error(e.stack));
