# Arduino Power Monitor

Real-time power monitoring system using Arduino and WebSocket communication.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure Arduino:
- Connect Arduino to COM3
- Upload the Arduino code to your board

3. Run the local bridge:
```bash
node local-bridge.js
```

4. Test the connection:
```bash
npm run test
```

## Project Structure

- `local-bridge.js`: Connects Arduino to WebSocket server
- `bridge.js`: WebSocket server for Render deployment
- `test-connection.js`: Tests Arduino and WebSocket connections

## Environment Variables

Create a `.env` file with:
```
RENDER_WS_URL=wss://energy-monitor-19xr.onrender.com
```

## Deployment

The project is deployed on Render at: https://energy-monitor-19xr.onrender.com 