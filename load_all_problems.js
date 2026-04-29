/**
 * Bulk Problem Loader — Loads all problems from both JSON files into the Online Judge.
 * 
 * Usage:
 *   1. Login as admin and get the JWT token
 *   2. Replace TOKEN below with your admin JWT
 *   3. Run: node load_all_problems.js
 */

const fs = require('fs');
const http = require('http');

const API_URL = 'http://localhost:5000';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWVjZmFjODdiZmZhNzYyOWQ2YmI5NmIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzcxNDE1MDIsImV4cCI6MTc3NzIyNzkwMn0.IQNL9knUEiOH_YUx8_FnHkDhKrrPCOeI6sCVWytoexg';  // ← Replace this!

function post(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const url = new URL(API_URL + path);
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(responseData) });
        } catch {
          resolve({ status: res.statusCode, body: responseData });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function loadFile(filename) {
  if (!fs.existsSync(filename)) {
    console.log(`  ⚠️  File not found: ${filename} — skipping`);
    return {};
  }

  const problems = JSON.parse(fs.readFileSync(filename, 'utf-8'));
  console.log(`\n📂 Loading from ${filename} (${problems.length} problems)...\n`);

  const ids = {};
  for (const p of problems) {
    try {
      const res = await post('/api/problems', p);
      if (res.status === 201 || res.status === 200) {
        const id = res.body.problem?._id || res.body._id || 'unknown';
        ids[p.title] = id;
        console.log(`  ✅ Created: ${p.title} → ${id}`);
      } else {
        const msg = res.body.message || res.body.error || `HTTP ${res.status}`;
        console.log(`  ❌ Failed:  ${p.title} → ${msg}`);
      }
    } catch (err) {
      console.log(`  ❌ Error:   ${p.title} → ${err.message}`);
    }
  }
  return ids;
}

async function main() {
  if (TOKEN === 'PASTE_YOUR_ADMIN_TOKEN_HERE') {
    console.error('\n❌ ERROR: You must paste your admin JWT token in the TOKEN variable!\n');
    console.error('Steps:');
    console.error('  1. Login: POST http://localhost:5000/api/auth/login');
    console.error('     Body: {"email":"testadmin01@example.com","password":"password1234"}');
    console.error('  2. Copy the "token" from the response');
    console.error('  3. Paste it in load_all_problems.js on line 13');
    console.error('  4. Run again: node load_all_problems.js\n');
    process.exit(1);
  }

  console.log('\n🚀 Online Judge — Bulk Problem Loader');
  console.log('═'.repeat(50));

  const ids1 = await loadFile('sample_problems.json');
  const ids2 = await loadFile('sample_problems_extended.json');
  
  const allIds = { ...ids1, ...ids2 };
  const count = Object.keys(allIds).length;
  
  console.log('\n' + '═'.repeat(50));
  console.log(`✅ Successfully loaded ${count} problems\n`);
  
  console.log('📋 PROBLEM IDs — Copy these for creating contests:');
  console.log('─'.repeat(50));
  for (const [title, id] of Object.entries(allIds)) {
    console.log(`  "${title}": "${id}"`);
  }
  console.log('─'.repeat(50));
  
  console.log('\n💡 Next step: Use these IDs to create contests via:');
  console.log('   POST http://localhost:5000/api/contests');
  console.log('   See admin_testing_guide.md for contest JSON templates.\n');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
