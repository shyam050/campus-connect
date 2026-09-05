/** Starts a local MongoDB for development: `npm run mongo` */
const { spawn } = require('child_process');
const path = require('path');
const { existsSync } = require('fs');

const root = path.join(__dirname, '..');
const mongod = path.join(root, '.mongodb-bin', 'mongod.exe');
const dataDir = path.join(root, '.mongodb-data');

if (!existsSync(mongod)) {
  console.error('mongod not found. Run `npm run mongo:setup` first.');
  process.exit(1);
}

console.log('Starting MongoDB on mongodb://127.0.0.1:27017 (data: ' + dataDir + ')');
console.log('Keep this terminal open while developing. Ctrl+C to stop.\n');

const child = spawn(mongod, ['--dbpath', dataDir, '--port', '27017', '--bind_ip', '127.0.0.1'], {
  stdio: 'inherit',
});
child.on('exit', (code) => process.exit(code ?? 0));
