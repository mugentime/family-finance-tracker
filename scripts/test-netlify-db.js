// Test Netlify's Neon database connection and set up tables
import { neon } from '@neondatabase/serverless';

// Use the actual Netlify database URL
const DATABASE_URL = 'postgresql://neondb_owner:npg_HD5JvZRfE4bl@ep-wandering-thunder-aeqthub4-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

console.log('🗄️  Testing Netlify Neon Database Connection...');

try {
  const sql = neon(DATABASE_URL);

  // Test connection
  console.log('📡 Testing connection...');
  const timeResult = await sql`SELECT NOW() as current_time`;
  console.log(`✅ Connected! Time: ${timeResult[0].current_time}`);

  // Check existing tables
  console.log('\n📊 Checking existing tables...');
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `;
  console.log(`Found ${tables.length} tables:`, tables.map(t => t.table_name));

  // Create tables if they don't exist
  console.log('\n🔧 Creating tables...');

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

  console.log('✅ Tables created/verified');

  // Insert default data
  console.log('\n📝 Checking/inserting default data...');

  const categoriesCount = await sql`SELECT COUNT(*) as count FROM transaction_categories`;
  if (categoriesCount[0].count === '0') {
    await sql`
      INSERT INTO transaction_categories (name, type, icon) VALUES
      ('Alimentación', 'expense', '🍔'),
      ('Transporte', 'expense', '🚗'),
      ('Entretenimiento', 'expense', '🎮'),
      ('Salario', 'income', '💰'),
      ('Ventas', 'income', '🛒')
    `;
    console.log('✅ Default categories inserted');
  }

  const usersCount = await sql`SELECT COUNT(*) as count FROM members`;
  if (usersCount[0].count === '0') {
    await sql`
      INSERT INTO members (username, email, password, role, status) VALUES
      ('admin', 'admin@example.com', 'admin123', 'admin', 'active'),
      ('usuario', 'user@example.com', 'user123', 'member', 'active')
    `;
    console.log('✅ Default users inserted');
  } else {
    console.log(`ℹ️  Users already exist (${usersCount[0].count})`);
  }

  // Show final counts and test data retrieval
  console.log('\n📊 Final database state:');
  const finalCategories = await sql`SELECT COUNT(*) as count FROM transaction_categories`;
  const finalUsers = await sql`SELECT COUNT(*) as count FROM members`;
  const finalTransactions = await sql`SELECT COUNT(*) as count FROM transactions`;

  console.log(`Categories: ${finalCategories[0].count}`);
  console.log(`Members: ${finalUsers[0].count}`);
  console.log(`Transactions: ${finalTransactions[0].count}`);

  // Test actual data retrieval like the API would
  console.log('\n📋 Testing data retrieval...');
  const members = await sql`SELECT id, username, email, role, status, telegram_id FROM members`;
  console.log('Members data:', JSON.stringify(members, null, 2));

  const categories = await sql`SELECT * FROM transaction_categories ORDER BY name`;
  console.log('Categories data:', JSON.stringify(categories, null, 2));

  console.log('\n🎉 Netlify database is ready for use!');

} catch (error) {
  console.error('❌ Database test failed:', error.message);
  process.exit(1);
}