import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import TelegramBot from 'node-telegram-bot-api';
import https from 'https';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

// Database imports
import { testConnection, closeConnection, initializeDatabase } from './database/connection.js';
import {
  MembersService,
  CategoriesService,
  TransactionsService,
  BudgetsService,
  ProductsService,
  OrdersService,
  DatabaseService
} from './services/databaseService.js';

const app = express();
const port = process.env.PORT || 8080;
const host = process.env.HOST || '0.0.0.0';

// Increased body limit to handle base64 images from frontend
app.use(express.json({ limit: '10mb' }));

// Security and optimization headers
app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
});

// ESM equivalent of __dirname for Railway deployment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Configuración de Gemini API ---
const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.error("API_KEY environment variable not set.");
    process.exit(1);
}
const ai = new GoogleGenAI({ apiKey });

// --- Configuración del Bot de Telegram ---
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error("TELEGRAM_BOT_TOKEN environment variable not set.");
    process.exit(1);
}
const bot = new TelegramBot(token, { polling: true });
if (process.env.NODE_ENV !== 'production') {
    console.log('Bot de Telegram inicializado. Esperando mensajes...');
}

// Almacenamiento temporal en memoria para transacciones pendientes
const pendingTransactions = new Map();

const transactionSchema = {
    type: Type.OBJECT,
    properties: {
        description: { type: Type.STRING, description: "Una descripción breve y clara del concepto, comercio o los artículos comprados." },
        amount: { type: Type.NUMBER, description: "El monto total." },
        date: { type: Type.STRING, description: "La fecha en formato YYYY-MM-DD." },
    },
    required: ["description", "amount", "date"],
};

// Log all incoming messages for debugging (dev only)
bot.on('message', (msg) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log('Mensaje recibido:', JSON.stringify(msg, null, 2));
    }
});

bot.on('photo', async (msg) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`Procesando foto recibida de ${msg.from.username} (ID: ${msg.from.id})...`);
    }
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;

    try {
        const transactionType = msg.caption?.toLowerCase().includes('/ingreso') ? 'income' : 'expense';
        await bot.sendMessage(chatId, '🤖 Analizando imagen... esto puede tardar un momento.');

        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileLink = await bot.getFileLink(fileId);

        const imageBuffer = await new Promise((resolve, reject) => {
            https.get(fileLink, (response) => {
                const data = [];
                response.on('data', (chunk) => data.push(chunk));
                response.on('end', () => resolve(Buffer.concat(data)));
                response.on('error', reject);
            });
        });

        const base64Image = imageBuffer.toString('base64');
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: 'image/jpeg',
            },
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    imagePart,
                    { text: "Analiza la imagen para extraer una descripción breve del concepto, el monto total y la fecha (en formato YYYY-MM-DD). La imagen puede ser un ticket de compra o un comprobante de transferencia." }
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: transactionSchema,
            },
        });
        
        const transactionData = JSON.parse(response.text);

        if (!transactionData.description || !transactionData.amount || !transactionData.date) {
            throw new Error("No se pudo extraer la información completa.");
        }
        
        const transactionId = randomUUID();
        const newTransaction = { 
            id: transactionId, 
            type: transactionType,
            ...transactionData 
        };

        if (!pendingTransactions.has(telegramId)) {
            pendingTransactions.set(telegramId, []);
        }
        pendingTransactions.get(telegramId).push(newTransaction);
        
        const typeText = transactionType === 'income' ? 'Ingreso' : 'Gasto';
        await bot.sendMessage(chatId, `✅ ¡Imagen procesada como ${typeText}!
        
        Descripción: ${transactionData.description}
        Monto: $${transactionData.amount.toFixed(2)}
        Fecha: ${transactionData.date}
        
        Abre la aplicación para asignar una categoría e importar esta transacción.`);

    } catch (error) {
        console.error('Error procesando el recibo:', error);
        await bot.sendMessage(chatId, '❌ Lo siento, no pude procesar la imagen. Inténtalo de nuevo con una imagen más clara y asegúrate de que contenga la información necesaria.');
    }
});

bot.onText(/\/start/, (msg) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Comando /start recibido de ${msg.from.username} (ID: ${msg.from.id})`);
  }
  bot.sendMessage(msg.chat.id, "¡Hola! Envíame una foto de un recibo o comprobante para procesarlo. Tu ID de usuario es: `" + msg.from.id + "`\n\nPuedes agregar `/ingreso` o `/egreso` al enviar la imagen para clasificarla.", { parse_mode: 'Markdown' });
});

bot.onText(/\/id/, (msg) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Comando /id recibido de ${msg.from.username} (ID: ${msg.from.id})`);
  }
  bot.sendMessage(msg.chat.id, "Tu ID de usuario de Telegram es: `" + msg.from.id + "`", { parse_mode: 'Markdown' });
});

// Add error handler for polling errors
bot.on('polling_error', (error) => {
    console.error('Error de polling de Telegram:', error.code, '-', error.message);
    console.error('Esto puede ocurrir si otro proceso está usando el mismo token o hay problemas de red.');
});

// --- Endpoints de la API para el Frontend ---
app.post('/api/generate-description', async (req, res) => {
    try {
        const { productName, keywords } = req.body;
        if (!productName) {
            return res.status(400).json({ error: 'productName is required' });
        }
        
        const prompt = `Genera una descripción de producto atractiva y concisa para "${productName}". Palabras clave a incluir: ${keywords || 'delicioso, fresco, calidad'}. La descripción debe ser de 1-2 frases cortas.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        res.json({ description: response.text });
    } catch (error) {
        console.error("Error in /api/generate-description:", error);
        res.status(500).json({ error: 'Failed to generate description' });
    }
});

app.post('/api/generate-image', async (req, res) => {
    try {
        const { productName } = req.body;
        if (!productName) {
            return res.status(400).json({ error: 'productName is required' });
        }
        
        const prompt = `Fotografía de producto profesional de "${productName}", estilo moderno de cafetería, bien iluminado, sobre una mesa de madera rústica, apetitoso.`;

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg'
            },
        });

        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
        
        res.json({ imageUrl });

    } catch (error) {
        console.error("Error in /api/generate-image:", error);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

app.get('/api/pending-transactions/:telegramId', (req, res) => {
    const { telegramId } = req.params;
    const transactions = pendingTransactions.get(Number(telegramId)) || [];
    res.json(transactions);
});

app.post('/api/confirm-transaction', (req, res) => {
    const { telegramId, transactionId } = req.body;
    if (!telegramId || !transactionId) {
        return res.status(400).json({ error: 'telegramId y transactionId son requeridos.' });
    }
    
    const userTransactions = pendingTransactions.get(Number(telegramId));
    if (userTransactions) {
        const filteredTransactions = userTransactions.filter(t => t.id !== transactionId);
        pendingTransactions.set(Number(telegramId), filteredTransactions);
    }
    
    res.status(200).json({ message: 'Transacción confirmada y eliminada de pendientes.' });
});

// Health check endpoint for Railway - Always responds OK for startup reliability
app.get('/health', async (req, res) => {
    const startTime = Date.now();

    try {
        // Basic health check - always returns OK if server is running
        const response = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.version,
            responseTime: Date.now() - startTime
        };

        // Try to get database health but don't fail if unavailable
        try {
            const dbHealth = await Promise.race([
                getDatabaseHealth(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Database health check timeout')), 5000))
            ]);
            response.database = dbHealth;
        } catch (dbError) {
            // Database not ready, but that's OK during startup
            response.database = {
                status: 'pending',
                message: 'Database initializing...',
                error: dbError.message
            };
        }

        res.status(200).json(response);
    } catch (error) {
        // Even if there's an error, return 200 for Railway healthcheck
        res.status(200).json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            message: 'Service starting...',
            error: error.message,
            responseTime: Date.now() - startTime
        });
    }
});

// Database API endpoints
app.get('/api/members', async (req, res) => {
    try {
        const members = await MembersService.getAll();
        res.json(members);
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Error fetching members:', error);
        }
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});

app.post('/api/members', async (req, res) => {
    try {
        const members = req.body;
        // For bulk updates, we'll handle this differently
        res.json(members);
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Error updating members:', error);
        }
        res.status(500).json({ error: 'Failed to update members' });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const categories = await CategoriesService.getAll();
        res.json(categories);
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Error fetching categories:', error);
        }
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

app.post('/api/categories', async (req, res) => {
    try {
        const categories = req.body;
        // For bulk updates, we'll handle this differently
        res.json(categories);
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Error updating categories:', error);
        }
        res.status(500).json({ error: 'Failed to update categories' });
    }
});

app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await TransactionsService.getAll();
        res.json(transactions);
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Error fetching transactions:', error);
        }
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

app.post('/api/transactions', async (req, res) => {
    try {
        const transactions = req.body;
        // For bulk updates, we'll handle this differently
        res.json(transactions);
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Error updating transactions:', error);
        }
        res.status(500).json({ error: 'Failed to update transactions' });
    }
});

app.get('/api/budgets', async (req, res) => {
    try {
        const budgets = await BudgetsService.getAll();
        res.json(budgets);
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Error fetching budgets:', error);
        }
        res.status(500).json({ error: 'Failed to fetch budgets' });
    }
});

app.post('/api/budgets', async (req, res) => {
    try {
        const budgets = req.body;
        // For bulk updates, we'll handle this differently
        res.json(budgets);
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Error updating budgets:', error);
        }
        res.status(500).json({ error: 'Failed to update budgets' });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const products = await ProductsService.getAll();
        res.json(products);
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Error fetching products:', error);
        }
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const products = req.body;
        // For bulk updates, we'll handle this differently
        res.json(products);
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Error updating products:', error);
        }
        res.status(500).json({ error: 'Failed to update products' });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        const orders = await OrdersService.getAll();
        res.json(orders);
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Error fetching orders:', error);
        }
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const orders = req.body;
        // For bulk updates, we'll handle this differently
        res.json(orders);
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Error updating orders:', error);
        }
        res.status(500).json({ error: 'Failed to update orders' });
    }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});


// Initialize database and start server
const startServer = async () => {
  try {
    // Start server first for Railway health checks
    const server = app.listen(port, host, () => {
      console.log(`Server listening on ${host}:${port}`);
    });

    // Initialize database asynchronously after server starts
    setTimeout(async () => {
      try {
        // First initialize database schema if using SQLite
        const schemaInitialized = await initializeDatabase();
        if (schemaInitialized) {
          console.log('Database schema initialized');
        }

        // Test database connection
        const dbConnected = await testConnection();
        if (dbConnected) {
          console.log('Database connected successfully');
          try {
            await DatabaseService.initializeData();
            console.log('Database data initialized successfully');
          } catch (initError) {
            console.warn('Database data initialization failed, continuing:', initError.message);
          }
        } else {
          console.warn('Database connection failed - running without database');
        }
      } catch (error) {
        console.error('Database initialization error:', error.message);
        console.warn('Continuing without database...');
      }
    }, 1000);

    // Graceful shutdown handling
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(async () => {
        await closeConnection();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(async () => {
        await closeConnection();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();