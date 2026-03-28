#!/usr/bin/env node

/**
 * Reset test user daily usage counter via Firestore REST API
 */

const https = require('https');

// Get current Firebase project from firebase.json
const fs = require('fs');
const path = require('path');

let projectId = 'wingman-pwa';

try {
  const firebaseJson = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
  if (firebaseJson.projects && firebaseJson.projects.default) {
    projectId = firebaseJson.projects.default;
  }
} catch (e) {
  console.log(`Using default project: ${projectId}`);
}

const TEST_USER_EMAIL = 'norman.dustin@gmail.com';

// Read firebase-debug.log to get auth token, or use Application Default Credentials
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${projectId}/databases/(default)/documents/users${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function resetUsage() {
  console.log('\n⚠️  Firebase CLI method required.\n');
  console.log('Use Firebase Console instead:');
  console.log('1. Open: https://console.firebase.google.com/project/wingman-pwa/firestore');
  console.log('2. Find collection "users"');
  console.log('3. Search for email = "norman.dustin@gmail.com"');
  console.log('4. Click that user document');
  console.log('5. Edit "usage" field:');
  console.log(`   - date: ${new Date().toISOString().split('T')[0]}`);
  console.log('   - count: 0');
  console.log('6. Save');
  console.log('\nOR use the script in functions/reset-usage.js instead.\n');
  process.exit(0);
}

resetUsage();
