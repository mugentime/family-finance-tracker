import { neon } from '@neondatabase/serverless';

// Database connection using Netlify's Neon integration
const sql = neon(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL);

// Initialize database tables
const initializeDatabase = async () => {
  try {
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

    // Insert default categories if not exist
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
    }

    // Insert default users if not exist
    const usersCount = await sql`SELECT COUNT(*) as count FROM members`;
    if (usersCount[0].count === '0') {
      await sql`
        INSERT INTO members (username, email, password, role, status) VALUES
        ('admin', 'admin@example.com', 'admin123', 'admin', 'active'),
        ('usuario', 'user@example.com', 'user123', 'member', 'active')
      `;
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

// API Routes
export default async (req, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  try {
    // Initialize database on first request
    await initializeDatabase();

    const { url, method } = req;
    console.log('DEBUG: Full URL:', url);
    console.log('DEBUG: Method:', method);

    // Handle different URL patterns
    let urlPath = url;
    if (url.includes('/.netlify/functions/api')) {
      urlPath = url.replace('/.netlify/functions/api', '');
    } else if (url.includes('/api')) {
      urlPath = url.replace('/api', '');
    }

    // Handle case where path might be empty
    if (urlPath === '' || urlPath === '/') {
      urlPath = '/members'; // Default for testing
    }

    console.log('DEBUG: Processed URL path:', urlPath);

    // Members endpoints
    if (urlPath === '/members' || urlPath.endsWith('members')) {
      if (method === 'GET') {
        const members = await sql`SELECT id, username, email, role, status, telegram_id FROM members`;
        return new Response(JSON.stringify(members), { status: 200, headers });
      }
      if (method === 'POST') {
        const body = await req.json();
        const { username, email, password, role = 'member' } = body;
        const result = await sql`
          INSERT INTO members (username, email, password, role, status)
          VALUES (${username}, ${email}, ${password}, ${role}, 'active')
          RETURNING id, username, email, role, status, telegram_id
        `;
        return new Response(JSON.stringify(result[0]), { status: 200, headers });
      }
    }

    // Categories endpoints
    if (urlPath === '/categories') {
      if (method === 'GET') {
        const categories = await sql`SELECT * FROM transaction_categories ORDER BY name`;
        return new Response(JSON.stringify(categories), { status: 200, headers });
      }
      if (method === 'POST') {
        const body = await req.json();
        const { name, type, icon } = body;
        const result = await sql`
          INSERT INTO transaction_categories (name, type, icon)
          VALUES (${name}, ${type}, ${icon})
          RETURNING *
        `;
        return new Response(JSON.stringify(result[0]), { status: 200, headers });
      }
    }

    // Transactions endpoints
    if (urlPath === '/transactions') {
      if (method === 'GET') {
        const transactions = await sql`
          SELECT t.*, c.name as category_name, c.icon as category_icon, m.username
          FROM transactions t
          LEFT JOIN transaction_categories c ON t.category_id = c.id
          LEFT JOIN members m ON t.member_id = m.id
          ORDER BY t.date DESC
        `;
        return new Response(JSON.stringify(transactions), { status: 200, headers });
      }
      if (method === 'POST') {
        const body = await req.json();
        const { description, amount, type, categoryId, memberId, date } = body;
        const result = await sql`
          INSERT INTO transactions (description, amount, type, category_id, member_id, date)
          VALUES (${description}, ${amount}, ${type}, ${categoryId}, ${memberId}, ${date})
          RETURNING *
        `;
        return new Response(JSON.stringify(result[0]), { status: 200, headers });
      }
    }

    // Transaction by ID endpoints
    if (urlPath.startsWith('/transactions/')) {
      const id = urlPath.split('/')[2];
      if (method === 'PUT') {
        const body = await req.json();
        const { description, amount, type, categoryId, date } = body;
        const result = await sql`
          UPDATE transactions
          SET description = ${description}, amount = ${amount}, type = ${type},
              category_id = ${categoryId}, date = ${date}, updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `;
        return new Response(JSON.stringify(result[0]), { status: 200, headers });
      }
      if (method === 'DELETE') {
        await sql`DELETE FROM transactions WHERE id = ${id}`;
        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }
    }

    // Default response
    return new Response(JSON.stringify({ error: 'Endpoint not found' }), { status: 404, headers });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers }
    );
  }
};