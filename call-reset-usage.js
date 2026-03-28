#!/usr/bin/env node

/**
 * Reset test user daily usage via Cloud Function
 * Usage: node call-reset-usage.js <email> [idToken]
 * 
 * If no token provided, will prompt you to log in to Firebase Authentication
 */

const https = require('https');
const readline = require('readline');

const email = process.argv[2] || 'norman.dustin@gmail.com';
const idToken = process.argv[3];

const API_URL = 'https://us-central1-wingman-pwa.cloudfunctions.net/resetUsage';

function makeRequest(url, method, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method,
      headers,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  try {
    let token = idToken;

    if (!token) {
      console.log('\n❓ No ID token provided.');
      console.log('Get one from: https://wingman-pwa.web.app');
      console.log('1. Open the app in Chrome');
      console.log('2. Inspect → Console');
      console.log('3. Paste: await auth.currentUser.getIdToken()');
      console.log('4. Copy the token output\n');

      token = await prompt('Paste your Firebase ID token: ');
    }

    if (!token || token.length < 100) {
      console.error('❌ Invalid token (too short)');
      process.exit(1);
    }

    console.log(`\nResetting usage for: ${email}`);
    console.log(`Calling: ${API_URL}\n`);

    const response = await makeRequest(
      API_URL,
      'POST',
      {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      { email }
    );

    if (response.status === 200 && response.body.success) {
      console.log('✅ Success!');
      console.log(`   UID: ${response.body.uid}`);
      console.log(`   Email: ${response.body.email}`);
      console.log(`   ${response.body.message}`);
      console.log(`\n🎉 Test user can now generate 5 new messages today!\n`);
    } else {
      console.error('❌ Error:', response.body.error || response.body);
      console.error(`   Status: ${response.status}`);
      process.exit(1);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
