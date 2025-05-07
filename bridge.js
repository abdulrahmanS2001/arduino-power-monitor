const WebSocket = require('ws');
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 10000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Create WebSocket server
const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});

const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('🔌 Client connected');
    clients.add(ws);

    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('📡 Received data:', data);
            
            // Broadcast to all connected clients
            clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
        } catch (error) {
            console.error('❌ Error processing message:', error);
        }
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log('🔌 Client disconnected');
        clients.delete(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        clients.delete(ws);
    });
});
