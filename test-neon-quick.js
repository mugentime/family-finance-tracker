// Quick test for Neon database
import { neon } from '@neondatabase/serverless';

// You can replace this with your actual Neon database URL
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:your_password@your-neon-host/neondb';

console.log('🧪 Quick Neon Database Test');
console.log('Database URL format:', DATABASE_URL.replace(/:[^:]*@/, ':****@'));

const sql = neon(DATABASE_URL);

async function quickTest() {
  try {
    console.log('\n📊 Testing connection...');
    const result = await sql`SELECT NOW() as time, 'Hello from Neon!' as message`;
    console.log('✅ SUCCESS! Database is working');
    console.log('   Time:', result[0].time);
    console.log('   Message:', result[0].message);

    console.log('\n📋 Checking tables...');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;

    if (tables.length === 0) {
      console.log('⚠️  No tables found');
      console.log('\n🔧 Creating tables...');

      // Create a simple test table
      await sql`
        CREATE TABLE IF NOT EXISTS app_test (
          id SERIAL PRIMARY KEY,
          message TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await sql`
        INSERT INTO app_test (message) VALUES ('Database is working!')
      `;

      console.log('✅ Test table created and data inserted');

      // Verify
      const testData = await sql`SELECT * FROM app_test`;
      console.log('📊 Test data:', testData);

    } else {
      console.log('✅ Found tables:', tables.map(t => t.table_name).join(', '));
    }

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.log('\n💡 Common issues:');
    console.log('   1. Check if DATABASE_URL is correct');
    console.log('   2. Verify Neon database is running');
    console.log('   3. Check if IP is whitelisted (if applicable)');
  }
}

quickTest();