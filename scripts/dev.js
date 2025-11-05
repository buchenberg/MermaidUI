import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.join(__dirname, '..', 'backend');

console.log('Starting backend server...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true
});

backend.on('error', (error) => {
  console.error('Failed to start backend:', error);
  process.exit(1);
});

// Wait a moment for backend to start, then start Tauri
setTimeout(() => {
  console.log('Starting Tauri...');
  const tauri = spawn('npm', ['run', 'tauri', 'dev'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true
  });

  tauri.on('error', (error) => {
    console.error('Failed to start Tauri:', error);
    backend.kill();
    process.exit(1);
  });

  // Clean up on exit
  process.on('SIGINT', () => {
    backend.kill();
    tauri.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    backend.kill();
    tauri.kill();
    process.exit(0);
  });

  tauri.on('exit', () => {
    backend.kill();
    process.exit(0);
  });
}, 2000); // Wait 2 seconds for backend to start

