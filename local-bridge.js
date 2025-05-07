const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const WebSocket = require('ws');

// Replace with your Render WebSocket URL
const RENDER_WS_URL = 'wss://energy-monitor-19xr.onrender.com';

// Connect to Arduino
const port = new SerialPort({ path: 'COM3', baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// Connect to WebSocket server
console.log('🔄 Attempting to connect to WebSocket server:', RENDER_WS_URL);
const ws = new WebSocket(RENDER_WS_URL);

ws.on('open', () => {
    console.log('✅ Connected to WebSocket server');
    // Send a test message to verify connection
    ws.send(JSON.stringify({
        type: 'connection_test',
        message: 'Bridge connected',
        timestamp: new Date().toISOString()
    }));
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
    console.error('Full error details:', error);
});

ws.on('close', (code, reason) => {
    console.log('🔌 Disconnected from WebSocket server');
    console.log('Close code:', code);
    console.log('Close reason:', reason);
    // Attempt to reconnect after 5 seconds
    setTimeout(() => {
        console.log('🔄 Attempting to reconnect...');
        ws.connect();
    }, 5000);
});

// Forward Arduino data to server
parser.on('data', line => {
    try {
        const jsonData = JSON.parse(line);
        console.log('📡 From Arduino:', jsonData);
        
        if (ws.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                ...jsonData,
                source: 'arduino',
                timestamp: new Date().toISOString()
            });
            ws.send(message);
            console.log('📤 Forwarded to server:', message);
        } else {
            console.log('⚠️ WebSocket not ready, data not forwarded. State:', ws.readyState);
        }
    } catch (error) {
        console.error('❌ Invalid JSON from Arduino:', line);
        console.error('Error:', error.message);
    }
}); 