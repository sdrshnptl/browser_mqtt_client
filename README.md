# Browser MQTT Client

A simple browser-based MQTT client using MQTT.js over WebSocket. This client allows you to connect to MQTT brokers, subscribe to topics, and publish messages directly from your web browser.

## Features

- Connect to any MQTT broker that supports WebSocket connections
- Subscribe to MQTT topics
- Publish messages to topics
- Real-time message display
- Connection status monitoring
- Detailed logging with different message types
- Support for both ws:// and wss:// protocols

## Setup

1. Clone this repository
2. Open `index.html` in a web browser
3. No build process required - it runs directly in the browser

## Common MQTT Broker URLs

- EMQX: `ws://broker.emqx.io:8083/mqtt`
- HiveMQ: `ws://broker.hivemq.com:8000/mqtt`
- Mosquitto: `ws://test.mosquitto.org:8080`

## Usage Examples

### Connecting to a broker
1. Enter the broker WebSocket URL
2. Click "Connect"
3. Wait for "Status: Connected"

### Subscribing to a topic
1. Enter a topic (e.g., "test/topic")
2. Click "Subscribe"
3. Messages will appear in the messages area

### Publishing messages
1. Enter a topic
2. Enter your message
3. Click "Publish"

## Protocol Support

- WebSocket (ws://) - Default port 8083
- Secure WebSocket (wss://) - Default port 8084
- MQTT (mqtt://) - Default port 1883 (browser security may block this)
- Secure MQTT (mqtts://) - Default port 8883 (browser security may block this)

## Error Messages

- Check the message area for detailed logs
- Different colors indicate different message types:
  - Blue: Info messages
  - Green: Success messages
  - Red: Error messages
  - Orange: Warning messages
  - Gray: MQTT messages

## Browser Compatibility

Tested and working in:
- Chrome 80+
- Firefox 75+
- Edge 80+
- Safari 13+
