import { execSync } from 'child_process';
import { unlinkSync } from 'fs';
import { existsSync } from 'fs';

try {
  // Remove old package-lock.json if it exists
  if (existsSync('package-lock.json')) {
    console.log('Removing old package-lock.json...');
    unlinkSync('package-lock.json');
  }

  // Run npm install to regenerate lock file
  console.log('Running npm install to regenerate lock file...');
  execSync('npm install', { stdio: 'inherit' });

  console.log('Lock file has been successfully regenerated!');
} catch (error) {
  console.error('Error fixing lock file:', error.message);
  process.exit(1);
}
