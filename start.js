const express = require('express');
const cors = require('cors');
const path = require('path');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { exec } = require('child_process');

// Initialize Express app
const app = express();
const PORT = 3000;

// Setup Arduino Serial Connection
const arduinoPort = new SerialPort({ path: 'COM3', baudRate: 9600 });
const parser = arduinoPort.pipe(new ReadlineParser({ delimiter: '\n' }));

// Store the latest Arduino reading
let latestArduinoData = null;

// Listen for Arduino data
parser.on('data', line => {
    try {
        const jsonData = JSON.parse(line);
        console.log('📡 From Arduino:', jsonData);
        latestArduinoData = jsonData;
    } catch (error) {
        console.error('❌ Invalid JSON from Arduino:', line);
        console.error('Error:', error.message);
    }
});

// Enable CORS
app.use(cors());

// Serve static files
app.use(express.static('./'));

// Arduino data endpoint
app.get('/arduino-data', (req, res) => {
    if (latestArduinoData) {
        // Create a copy of the data and modify the power value
        const modifiedData = {
            ...latestArduinoData,
            power: latestArduinoData.power * 300
        };
        
        res.json({
            data: modifiedData,
            timestamp: new Date().toISOString()
        });
    } else {
        res.json({
            error: 'No data received from Arduino yet',
            timestamp: new Date().toISOString()
        });
    }
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server and open browser
app.listen(PORT, () => {
    console.log(`
🚀 Server is running on http://localhost:${PORT}
📡 Listening for Arduino on COM3...
    `);
    
    // Open the default browser
    const start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
    exec(`${start} http://localhost:${PORT}`);
}); 