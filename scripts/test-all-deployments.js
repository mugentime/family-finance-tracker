// Comprehensive test for all deployments and databases
import { neon } from '@neondatabase/serverless';
import fetch from 'node-fetch';

// Test configurations
const tests = {
  local: 'http://localhost:8080',
  railway: 'https://dineritou-production.up.railway.app',
  netlify: 'https://dineritou.netlify.app'
};

console.log('🧪 Comprehensive Deployment & Database Test\n');

// Test 1: Local Server
async function testLocal() {
  console.log('📍 Testing Local Server...');
  try {
    const response = await fetch(`${tests.local}/api/members`);
    console.log(`   Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Local API working - Found ${data.length} members`);
      return true;
    } else {
      console.log('   ⚠️  Local API not responding correctly');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Local server not running');
    return false;
  }
}

// Test 2: Railway Deployment
async function testRailway() {
  console.log('\n🚂 Testing Railway Deployment...');
  try {
    const response = await fetch(`${tests.railway}/api/members`);
    console.log(`   Status: ${response.status}`);
    const text = await response.text();

    if (response.ok) {
      const data = JSON.parse(text);
      console.log(`   ✅ Railway API working - Found ${data.length} members`);
      return true;
    } else if (text.includes('Cannot GET')) {
      console.log('   ⚠️  Railway running but API routes missing');
      return false;
    } else {
      console.log('   ⚠️  Railway API error:', text.substring(0, 100));
      return false;
    }
  } catch (error) {
    console.log('   ❌ Railway deployment error:', error.message);
    return false;
  }
}

// Test 3: Netlify Deployment
async function testNetlify() {
  console.log('\n🌐 Testing Netlify Deployment...');
  try {
    // Test main site
    const siteResponse = await fetch(tests.netlify);
    console.log(`   Main site status: ${siteResponse.status}`);

    // Test API function
    const apiResponse = await fetch(`${tests.netlify}/api/members`);
    console.log(`   API status: ${apiResponse.status}`);

    if (apiResponse.ok) {
      const data = await apiResponse.json();
      console.log(`   ✅ Netlify API working - Found ${data.length} members`);
      return true;
    } else {
      const error = await apiResponse.text();
      console.log('   ⚠️  Netlify API error:', error.substring(0, 100));
      return false;
    }
  } catch (error) {
    console.log('   ❌ Netlify deployment error:', error.message);
    return false;
  }
}

// Test 4: Database Connection (if DATABASE_URL provided)
async function testDatabase() {
  console.log('\n🗄️  Testing Direct Database Connection...');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes('localhost')) {
    console.log('   ⚠️  No production DATABASE_URL found');
    console.log('   💡 To test database: set DATABASE_URL=your_neon_connection_string');
    return false;
  }

  try {
    const sql = neon(dbUrl);
    const result = await sql\`SELECT NOW() as time, COUNT(*) as test FROM information_schema.tables WHERE table_schema = 'public'\`;
    console.log(\`   ✅ Database connected - Time: \${result[0].time}\`);
    console.log(\`   📊 Public tables: \${result[0].test}\`);
    return true;
  } catch (error) {
    console.log('   ❌ Database connection failed:', error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  const results = {
    local: await testLocal(),
    railway: await testRailway(),
    netlify: await testNetlify(),
    database: await testDatabase()
  };

  console.log('\n📊 Test Results Summary:');
  console.log('   Local Server:', results.local ? '✅ Working' : '❌ Not Working');
  console.log('   Railway:', results.railway ? '✅ Working' : '❌ Not Working');
  console.log('   Netlify:', results.netlify ? '✅ Working' : '❌ Not Working');
  console.log('   Database:', results.database ? '✅ Connected' : '❌ Not Connected');

  console.log('\n💡 Recommendations:');

  if (!results.local && !results.railway && !results.netlify) {
    console.log('   🚨 No working deployments found!');
    console.log('   1. Start local server: npm run dev or node server.js');
    console.log('   2. Check Railway deployment logs');
    console.log('   3. Verify Netlify functions deployment');
  } else if (results.local && !results.railway) {
    console.log('   🔧 Railway needs database configuration');
    console.log('   1. Add DATABASE_URL to Railway environment');
    console.log('   2. Redeploy Railway with latest code');
  } else if (results.local && !results.netlify) {
    console.log('   🔧 Netlify functions need setup');
    console.log('   1. Verify netlify.toml configuration');
    console.log('   2. Add DATABASE_URL to Netlify environment');
    console.log('   3. Check function deployment logs');
  }

  if (!results.database) {
    console.log('   🗄️  Database setup needed');
    console.log('   1. Get Neon database URL from dashboard');
    console.log('   2. Set DATABASE_URL environment variable');
    console.log('   3. Run: DATABASE_URL=your_url node scripts/test-database.js');
  }
}

runAllTests();