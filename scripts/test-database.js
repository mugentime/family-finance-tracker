// Test script to verify Neon database connection and setup
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ No DATABASE_URL found in environment variables');
  console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE')));
  process.exit(1);
}

console.log('🔗 Testing database connection...');
console.log('Database URL:', DATABASE_URL.replace(/:[^:]*@/, ':****@')); // Hide password

const sql = neon(DATABASE_URL);

async function testDatabase() {
  try {
    console.log('\n📊 Testing basic connection...');
    const result = await sql`SELECT NOW() as current_time, version() as postgres_version`;
    console.log('✅ Connection successful!');
    console.log('   Time:', result[0].current_time);
    console.log('   Version:', result[0].postgres_version.split(' ')[0]);

    console.log('\n📋 Checking existing tables...');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    if (tables.length === 0) {
      console.log('⚠️  No tables found - database needs initialization');
      return { connected: true, initialized: false, tables: [] };
    } else {
      console.log('✅ Found tables:');
      tables.forEach(table => console.log(`   - ${table.table_name}`));
    }

    console.log('\n👥 Checking data...');

    // Check if we have the expected tables
    const expectedTables = ['members', 'transaction_categories', 'transactions'];
    const existingTableNames = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(t => !existingTableNames.includes(t));

    if (missingTables.length > 0) {
      console.log('⚠️  Missing tables:', missingTables.join(', '));
      return { connected: true, initialized: false, tables: existingTableNames };
    }

    // Check data in tables
    try {
      const memberCount = await sql`SELECT COUNT(*) as count FROM members`;
      const categoryCount = await sql`SELECT COUNT(*) as count FROM transaction_categories`;
      const transactionCount = await sql`SELECT COUNT(*) as count FROM transactions`;

      console.log('📊 Data counts:');
      console.log(`   Members: ${memberCount[0].count}`);
      console.log(`   Categories: ${categoryCount[0].count}`);
      console.log(`   Transactions: ${transactionCount[0].count}`);

      return {
        connected: true,
        initialized: true,
        tables: existingTableNames,
        data: {
          members: parseInt(memberCount[0].count),
          categories: parseInt(categoryCount[0].count),
          transactions: parseInt(transactionCount[0].count)
        }
      };
    } catch (dataError) {
      console.log('⚠️  Tables exist but data check failed:', dataError.message);
      return { connected: true, initialized: false, tables: existingTableNames };
    }

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return { connected: false, initialized: false, error: error.message };
  }
}

async function initializeIfNeeded(testResult) {
  if (!testResult.connected) {
    console.log('\n❌ Cannot initialize - no connection');
    return false;
  }

  if (testResult.initialized) {
    console.log('\n✅ Database already initialized');
    return true;
  }

  console.log('\n🔧 Initializing database...');

  try {
    // Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'member',
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        telegram_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS transaction_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        icon VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        date TIMESTAMP NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        type VARCHAR(50) NOT NULL,
        category_id INTEGER REFERENCES transaction_categories(id),
        member_id INTEGER REFERENCES members(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('✅ Tables created');

    // Insert default data
    const memberCount = await sql`SELECT COUNT(*) as count FROM members`;
    if (parseInt(memberCount[0].count) === 0) {
      await sql`
        INSERT INTO members (username, email, password, role, status) VALUES
        ('admin', 'admin@familia.com', 'password123', 'admin', 'approved'),
        ('usuario', 'user@familia.com', 'password123', 'member', 'approved')
      `;
      console.log('✅ Default members created');
    }

    const categoryCount = await sql`SELECT COUNT(*) as count FROM transaction_categories`;
    if (parseInt(categoryCount[0].count) === 0) {
      await sql`
        INSERT INTO transaction_categories (name, type, icon) VALUES
        ('Alimentos', 'expense', '🛒'),
        ('Vivienda', 'expense', '🏡'),
        ('Transporte', 'expense', '🚗'),
        ('Servicios', 'expense', '💡'),
        ('Entretenimiento', 'expense', '🎬'),
        ('Salud', 'expense', '❤️‍🩹'),
        ('Educación', 'expense', '🎓'),
        ('Otro Gasto', 'expense', '📦'),
        ('Salario', 'income', '💼'),
        ('Bonos', 'income', '🎁'),
        ('Inversiones', 'income', '📈'),
        ('Otro Ingreso', 'income', '🪙')
      `;
      console.log('✅ Default categories created');
    }

    console.log('🎉 Database initialization complete!');
    return true;

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
}

// Main execution
console.log('🧪 Family Finance Tracker - Database Test\n');

testDatabase()
  .then(async (result) => {
    console.log('\n📋 Test Summary:');
    console.log('   Connected:', result.connected ? '✅' : '❌');
    console.log('   Initialized:', result.initialized ? '✅' : '⚠️');

    if (result.connected && !result.initialized) {
      console.log('\n🔧 Attempting to initialize...');
      const initResult = await initializeIfNeeded(result);
      if (initResult) {
        console.log('\n🎉 Database is now ready!');
        // Test again to confirm
        const finalTest = await testDatabase();
        console.log('\n📊 Final status:');
        console.log('   Connected:', finalTest.connected ? '✅' : '❌');
        console.log('   Initialized:', finalTest.initialized ? '✅' : '❌');
      }
    }
  })
  .catch(error => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });