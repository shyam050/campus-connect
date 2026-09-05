/**
 * One-time setup: copies the mongod binary downloaded by mongodb-memory-server
 * (if present) into .mongodb-bin/ and ensures the data directory exists, so
 * `npm run mongo` works without installing MongoDB.
 *
 * If no cached binary is found it downloads MongoDB via mongodb-memory-server
 * into the standard cache, then links it. Requires `npm run install:all` first.
 */
const { existsSync, mkdirSync, copyFileSync, readdirSync } = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const cacheDir = path.join(process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Local'), 'mongodb-binaries');
const altCacheDir = path.join(process.env.USERPROFILE, '.cache', 'mongodb-binaries');
const binDir = path.join(root, '.mongodb-bin');
const dataDir = path.join(root, '.mongodb-data');

mkdirSync(dataDir, { recursive: true });

function findMongod(dir) {
  if (!existsSync(dir)) return null;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (entry.toLowerCase().startsWith('mongod') && entry.endsWith('.exe')) return full;
    if (!entry.includes('.')) {
      const nested = findMongod(full);
      if (nested) return nested;
    }
  }
  return null;
}

const src = findMongod(cacheDir) || findMongod(altCacheDir);
mkdirSync(binDir, { recursive: true });

if (src) {
  const dest = path.join(binDir, 'mongod.exe');
  copyFileSync(src, dest);
  console.log(`✓ mongod copied from cache → ${dest}`);
} else if (existsSync(path.join(binDir, 'mongod.exe'))) {
  console.log(`✓ mongod already present → ${path.join(binDir, 'mongod.exe')}`);
} else {
  console.log('No cached mongod found — downloading one via mongodb-memory-server…');
  const { MongoMemoryServer } = require(path.join(root, 'server', 'node_modules', 'mongodb-memory-server'));
  MongoMemoryServer.create()
    .then((m) => {
      const uri = m.getUri();
      const exePath = m._instanceInfo?.binaryPath;
      if (exePath) copyFileSync(exePath, path.join(binDir, 'mongod.exe'));
      return m.stop().then(() => {
        console.log(`✓ mongod downloaded → ${path.join(binDir, 'mongod.exe')}`);
        console.log('  (a temporary instance was started and stopped; data dir is ready)');
        void uri;
      });
    })
    .catch((err) => {
      console.error('Download failed:', err.message);
      console.error('Alternative: use MongoDB Atlas (free) — put its URI in server/.env');
      process.exit(1);
    });
}
