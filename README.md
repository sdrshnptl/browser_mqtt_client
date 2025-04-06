# Browser MQTT Client

A simple browser-based MQTT client using MQTT.js over WebSocket. This client allows you to connect to MQTT brokers, subscribe to topics, and publish messages directly from your web browser.

## Features

- Connect to any MQTT broker that supports WebSocket connections
- Subscribe/Unsubscribe to MQTT topics
- Publish messages to topics
- Real-time message display with auto-scroll
- Advanced logging controls:
  - Filter messages by type
  - Auto-scroll toggle
  - Download logs
  - Open logs in separate window
- Connection status monitoring
- Support for both ws:// and wss:// protocols

## Setup

1. Clone this repository
2. Open `index.html` in a web browser
3. No build process required - it runs directly in the browser

## Common MQTT Broker URLs

When accessing the client over HTTPS, you must use secure WebSocket (wss://) connections:

- EMQX: `wss://broker.emqx.io:8084/mqtt`
- HiveMQ: `wss://broker.hivemq.com:8884/mqtt`
- Mosquitto: `wss://test.mosquitto.org:8081`

Note: When running locally over HTTP, you can use regular WebSocket (ws://) connections.

## Usage Examples

### Connecting to a broker
1. Enter the broker WebSocket URL
   - Use `wss://` URLs when accessing over HTTPS
   - Use `ws://` URLs only when accessing locally over HTTP
2. Click "Connect"
3. Wait for "Status: Connected"

### Managing Topic Subscriptions
1. Enter a topic (e.g., "test/topic")
2. Click "Subscribe" to start receiving messages
3. Click "Unsubscribe" to stop receiving messages
4. Messages will appear in the messages area

### Using Log Controls
1. Toggle auto-scroll with the checkbox
2. Filter messages using the multi-select dropdown
3. Open logs in a new window using "Open Logs Window"
4. Download visible logs using "Download Logs"

### Publishing messages
1. Enter a topic
2. Enter your message
3. Click "Publish"

## Protocol Support

- Secure WebSocket (wss://) - Default port 8084 - **Recommended for HTTPS sites**
- WebSocket (ws://) - Default port 8083 - Only works when accessing over HTTP
- MQTT (mqtt://) - Default port 1883 (Not supported in browsers)
- Secure MQTT (mqtts://) - Default port 8883 (Not supported in browsers)

## Error Messages

- Check the message area for detailed logs
- Different colors indicate different message types:
  - Blue: Info messages
  - Green: Success messages
  - Red: Error messages
  - Orange: Warning messages
  - Gray: MQTT messages

## Message Types

Different colors indicate different message types:
- Blue: Info messages
- Green: Success messages (connections, subscriptions)
- Red: Error messages
- Orange: Warning messages
- Gray: MQTT messages

## Log Management

- **Auto-scroll:** Automatically scroll to new messages
- **Message Filtering:** Show/hide specific message types
- **External Window:** View logs in a separate window
- **Download:** Save visible messages as a text file

## Security Notes

- When accessing this client over HTTPS, you must use secure WebSocket (wss://) connections
- Attempting to connect to insecure WebSocket endpoints (ws://) from HTTPS will be blocked by the browser
- For local development over HTTP, both ws:// and wss:// protocols are supported

## Browser Compatibility

Tested and working in:
- Chrome 80+
- Firefox 75+
- Edge 80+
- Safari 13+
