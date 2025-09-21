// Minimal test server for Railway deployment verification
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Minimal test server running'
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Railway deployment test successful!',
        timestamp: new Date().toISOString()
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Test server running on port ${port}`);
});