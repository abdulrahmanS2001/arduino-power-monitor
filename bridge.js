const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const ARDUINO_PORT = process.env.ARDUINO_PORT || 'COM3';
const ARDUINO_BAUDRATE = parseInt(process.env.ARDUINO_BAUDRATE) || 9600;

// Enable CORS
app.use(cors());

// Serve static files
app.use(express.static('./'));

// Create WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Store connected clients
const clients = new Set();

// Connect to Arduino
const port = new SerialPort({ 
    path: ARDUINO_PORT, 
    baudRate: ARDUINO_BAUDRATE 
});
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('🔌 New client connected');
    clients.add(ws);

    ws.on('close', () => {
        console.log('🔌 Client disconnected');
        clients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        clients.delete(ws);
    });
});

// Broadcast data to all connected clients
function broadcast(data) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Create HTTP server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Listening for Arduino on ${ARDUINO_PORT}...`);
});

// Upgrade HTTP server to WebSocket
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Forward Arduino data to WebSocket clients
parser.on('data', line => {
    try {
        const jsonData = JSON.parse(line);
        console.log('📡 From Arduino:', jsonData);
        
        // Broadcast to all connected clients
        broadcast({
            ...jsonData,
            source: 'arduino',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Invalid JSON from Arduino:', line);
        console.error('Error:', error.message);
    }
});
