// Test Netlify functions API endpoints
import fetch from 'node-fetch';

// Replace with your actual Netlify site URL
const NETLIFY_SITE_URL = process.env.NETLIFY_SITE_URL || 'https://your-app-name.netlify.app';

console.log('🧪 Testing Netlify Functions API');
console.log('Site URL:', NETLIFY_SITE_URL);

async function testNetlifyAPI() {
  const endpoints = [
    '/api/members',
    '/api/categories',
    '/api/transactions'
  ];

  for (const endpoint of endpoints) {
    const url = `${NETLIFY_SITE_URL}${endpoint}`;
    console.log(`\n📡 Testing ${endpoint}...`);

    try {
      const response = await fetch(url);
      console.log(`   Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Response:`, JSON.stringify(data, null, 2));
      } else {
        const error = await response.text();
        console.log(`   ❌ Error:`, error);
      }
    } catch (error) {
      console.log(`   ❌ Request failed:`, error.message);
    }
  }

  // Test creating a member
  console.log('\n📝 Testing POST /api/members...');
  try {
    const response = await fetch(`${NETLIFY_SITE_URL}/api/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'test123',
        role: 'member'
      })
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Created user:`, data);
    } else {
      const error = await response.text();
      console.log(`   ❌ Error:`, error);
    }
  } catch (error) {
    console.log(`   ❌ Request failed:`, error.message);
  }
}

testNetlifyAPI();