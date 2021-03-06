'use strict';

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const bhttp = require('bhttp');
const config = require('../config').config;
const common = require('../common');
const { toMap, mkdirpAsync } = require('../helpers');

const session = bhttp.session({
  headers: {
    'user-agent': config.useragent || 'Gzemnid'
  }
});

async function run() {
  await mkdirpAsync(path.join(config.dir, 'meta/'));
  console.log('Reading meta directory...');
  const current = await fs.readdirAsync(path.join(config.dir, 'meta/'));
  const map = toMap(current);

  const queue = [];
  await common.listInfo(info => {
    if (!info.tar) {
      console.log(`${info.id}: no tar!`);
      return;
    }

    const url = `https://registry.npmjs.org/${info.name}`;
    const file = `${info.id}.json`;
    if (!map.has(file)) {
      queue.push([url, file]);
    }

    map.set(file, true);
  });

  console.log(`To download: ${queue.length}.`);
  let updated = 0;
  for (const [url, file] of queue) {
    console.log(`Downloading: ${file}...`);
    const out = path.join(config.dir, 'meta/', file);
    const response = await session.get(url, { stream: true });
    response.pipe(fs.createWriteStream(out));
    updated++;
    if (updated % 100 === 0) {
      console.log(`Downloaded: ${updated}/${queue.length}...`);
    }
  }
  console.log(`New/updated: ${updated}.`);

  let moved = 0;
  for (const [file, keep] of map) {
    if (keep) continue;
    if (moved === 0) {
      await mkdirpAsync(path.join(config.dir, 'meta.old/'));
    }
    await fs.renameAsync(
      path.join(config.dir, 'meta/', file),
      path.join(config.dir, 'meta.old/', file)
    );
    moved++;
  }
  console.log(`Moved: ${moved}.`);

  console.log('END');
}

module.exports = {
  run
};
