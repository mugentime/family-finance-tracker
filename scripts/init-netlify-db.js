// Initialize Netlify database with Neon
// This can be run manually or on first deploy

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function initializeNetlifyDatabase() {
  try {
    console.log('Initializing Netlify database...');

    // Create members table
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

    // Create transaction_categories table
    await sql`
      CREATE TABLE IF NOT EXISTS transaction_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        icon VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create transactions table
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

    // Create budgets table
    await sql`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES transaction_categories(id),
        amount DECIMAL(10,2) NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('Tables created successfully');

    // Insert default categories
    const categoriesCount = await sql`SELECT COUNT(*) as count FROM transaction_categories`;
    if (parseInt(categoriesCount[0].count) === 0) {
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
      console.log('Default categories inserted');
    }

    // Insert default users
    const usersCount = await sql`SELECT COUNT(*) as count FROM members`;
    if (parseInt(usersCount[0].count) === 0) {
      await sql`
        INSERT INTO members (username, email, password, role, status) VALUES
        ('admin', 'admin@familia.com', 'password123', 'admin', 'approved'),
        ('usuario1', 'usuario@familia.com', 'password123', 'member', 'approved')
      `;
      console.log('Default users inserted');
    }

    console.log('✅ Netlify database initialized successfully!');

    // Test the database
    const members = await sql`SELECT COUNT(*) as count FROM members`;
    const categories = await sql`SELECT COUNT(*) as count FROM transaction_categories`;

    console.log(`📊 Database stats:`);
    console.log(`   Members: ${members[0].count}`);
    console.log(`   Categories: ${categories[0].count}`);

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeNetlifyDatabase();
}

export { initializeNetlifyDatabase };