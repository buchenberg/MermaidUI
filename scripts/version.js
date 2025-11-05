#!/usr/bin/env node

/**
 * Version bump script for MermaidUI
 * Updates version numbers in package.json, Cargo.toml, and tauri.conf.json
 * 
 * Usage:
 *   node scripts/version.js patch   # 1.0.0 -> 1.0.1
 *   node scripts/version.js minor   # 1.0.0 -> 1.1.0
 *   node scripts/version.js major   # 1.0.0 -> 2.0.0
 *   node scripts/version.js 1.2.3   # Set to specific version
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function parseVersion(version) {
  const parts = version.split('.').map(Number);
  return { major: parts[0], minor: parts[1], patch: parts[2] };
}

function bumpVersion(currentVersion, type) {
  const { major, minor, patch } = parseVersion(currentVersion);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      // Assume it's a specific version string
      if (/^\d+\.\d+\.\d+$/.test(type)) {
        return type;
      }
      throw new Error(`Invalid version type: ${type}. Use 'major', 'minor', 'patch', or a version like '1.2.3'`);
  }
}

function updateJsonFile(filePath, updateFn) {
  const content = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  updateFn(data);
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function updateTomlFile(filePath, newVersion) {
  const content = readFileSync(filePath, 'utf-8');
  const updated = content.replace(/^version = "[\d.]+"$/m, `version = "${newVersion}"`);
  writeFileSync(filePath, updated);
}

function updateVersion(newVersion) {
  console.log(`Updating version to ${newVersion}...`);
  
  // Update package.json
  updateJsonFile(join(rootDir, 'package.json'), (data) => {
    data.version = newVersion;
  });
  
  // Update Cargo.toml
  updateTomlFile(join(rootDir, 'src-tauri/Cargo.toml'), newVersion);
  
  // Update tauri.conf.json
  updateJsonFile(join(rootDir, 'src-tauri/tauri.conf.json'), (data) => {
    data.package.version = newVersion;
  });
  
  console.log(`✓ Version updated to ${newVersion} in all files`);
}

// Get current version from package.json
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
const currentVersion = packageJson.version;

// Get version type from command line
const versionType = process.argv[2];

if (!versionType) {
  console.log(`Current version: ${currentVersion}`);
  console.log('\nUsage:');
  console.log('  node scripts/version.js patch   # Bump patch version (1.0.0 -> 1.0.1)');
  console.log('  node scripts/version.js minor   # Bump minor version (1.0.0 -> 1.1.0)');
  console.log('  node scripts/version.js major   # Bump major version (1.0.0 -> 2.0.0)');
  console.log('  node scripts/version.js 1.2.3   # Set to specific version');
  process.exit(1);
}

try {
  const newVersion = bumpVersion(currentVersion, versionType);
  updateVersion(newVersion);
  console.log(`\nNext steps:`);
  console.log(`  1. git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json`);
  console.log(`  2. git commit -m "chore: bump version to ${newVersion}"`);
  console.log(`  3. git tag -a v${newVersion} -m "Release v${newVersion}"`);
  console.log(`  4. git push origin main --tags`);
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}

