const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const WebSocket = require('ws');

// Test configuration
const RENDER_WS_URL = 'wss://energy-monitor-19xr.onrender.com';
const ARDUINO_PORT = 'COM3';
const BAUD_RATE = 9600;

console.log('🔍 Starting connection test...');

// Test Arduino connection
console.log(`\n1️⃣ Testing Arduino connection on ${ARDUINO_PORT}...`);
const port = new SerialPort({ path: ARDUINO_PORT, baudRate: BAUD_RATE });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

port.on('open', () => {
    console.log('✅ Arduino port opened successfully');
});

port.on('error', (error) => {
    console.error('❌ Arduino connection error:', error.message);
});

// Test WebSocket connection
console.log('\n2️⃣ Testing WebSocket connection to Render...');
const ws = new WebSocket(RENDER_WS_URL);

ws.on('open', () => {
    console.log('✅ Connected to WebSocket server');
    
    // Send a test message
    const testMessage = {
        type: 'test',
        message: 'Connection test',
        timestamp: new Date().toISOString()
    };
    ws.send(JSON.stringify(testMessage));
    console.log('📤 Sent test message to server');
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
});

ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
});

// Test Arduino data forwarding
console.log('\n3️⃣ Testing Arduino data forwarding...');
parser.on('data', line => {
    try {
        const jsonData = JSON.parse(line);
        console.log('📡 Received from Arduino:', jsonData);
        
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                ...jsonData,
                source: 'arduino',
                timestamp: new Date().toISOString()
            }));
            console.log('📤 Forwarded Arduino data to server');
        } else {
            console.log('⚠️ WebSocket not ready, data not forwarded');
        }
    } catch (error) {
        console.error('❌ Invalid JSON from Arduino:', line);
        console.error('Error:', error.message);
    }
});

// Keep the script running
process.on('SIGINT', () => {
    console.log('\n🛑 Test stopped by user');
    port.close();
    ws.close();
    process.exit();
}); 