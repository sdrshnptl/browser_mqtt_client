let client = null;

// DOM elements
const brokerUrl = document.getElementById('broker-url');
const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const statusDiv = document.getElementById('connection-status');
const subscribeTopic = document.getElementById('subscribe-topic');
const subscribeBtn = document.getElementById('subscribe-btn');
const publishTopic = document.getElementById('publish-topic');
const publishMessage = document.getElementById('publish-message');
const publishBtn = document.getElementById('publish-btn');
const messagesDiv = document.getElementById('messages');

function validateAndFormatUrl(url) {
    try {
        // Handle raw hostname/IP inputs
        if (!url.includes('://')) {
            url = 'mqtt://' + url;
        }
        
        const urlObj = new URL(url);
        
        // Set default ports based on protocol
        if (!urlObj.port) {
            switch (urlObj.protocol) {
                case 'mqtt:':
                    urlObj.port = '1883';
                    break;
                case 'mqtts:':
                    urlObj.port = '8883';
                    break;
                case 'ws:':
                    urlObj.port = '8083';
                    break;
                case 'wss:':
                    urlObj.port = '8084';
                    break;
            }
        }
        
        // Add /mqtt path only for WebSocket connections
        if ((urlObj.protocol === 'ws:' || urlObj.protocol === 'wss:') && 
            (!urlObj.pathname || urlObj.pathname === '/')) {
            urlObj.pathname = '/mqtt';
        }
        
        return urlObj.toString();
    } catch (err) {
        throw new Error('Invalid broker URL format');
    }
}

function getMQTTOptions(urlObj) {
    return {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        protocolVersion: 4,
        keepalive: 60,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 5000,
        rejectUnauthorized: false
    };
}

// Update placeholder in HTML
brokerUrl.placeholder = 'broker.emqx.io or mqtt://broker.emqx.io:1883';

function log(type, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [${type}] ${message}`;
    console.log(logMessage, data || '');
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type.toLowerCase()}`;
    messageElement.textContent = logMessage;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Connect button handler
connectBtn.addEventListener('click', () => {
    if (!brokerUrl.value) {
        alert('Please enter a broker URL');
        return;
    }

    try {
        const formattedUrl = validateAndFormatUrl(brokerUrl.value);
        const urlObj = new URL(formattedUrl);
        const options = getMQTTOptions(urlObj);
        
        log('INFO', 'Connecting with options:', options);
        statusDiv.textContent = 'Status: Connecting...';
        
        if (client) {
            log('INFO', 'Cleaning up existing connection');
            client.end(true);
        }

        client = mqtt.connect(options);

        // Set connection timeout
        const timeoutId = setTimeout(() => {
            if (client && client.connected !== true) {
                client.end(true);
                const msg = 'Connection timeout after ' + options.connectTimeout + 'ms';
                log('ERROR', msg);
                statusDiv.textContent = 'Status: ' + msg;
                setConnectedState(false);
            }
        }, options.connectTimeout);

        client.on('connect', () => {
            clearTimeout(timeoutId);
            log('SUCCESS', 'Connected to broker');
            statusDiv.textContent = 'Status: Connected';
            setConnectedState(true);
        });

        client.on('error', (err) => {
            log('ERROR', 'Connection error:', err);
            statusDiv.textContent = 'Status: Error - ' + err.message;
            setConnectedState(false);
        });

        client.on('close', () => {
            log('WARN', 'Connection closed');
            statusDiv.textContent = 'Status: Disconnected';
            setConnectedState(false);
        });

        client.on('reconnect', () => {
            log('INFO', 'Attempting to reconnect');
        });

        client.on('offline', () => {
            log('WARN', 'Client went offline');
        });

        client.on('message', (topic, message) => {
            log('MESSAGE', `${topic}: ${message.toString()}`);
        });

    } catch (err) {
        log('ERROR', 'Connection setup error:', err);
        statusDiv.textContent = 'Status: Error - ' + err.message;
    }
});

// Disconnect button handler
disconnectBtn.addEventListener('click', () => {
    if (client) {
        client.end();
        client = null;
    }
});

// Subscribe button handler
subscribeBtn.addEventListener('click', () => {
    if (!subscribeTopic.value) {
        alert('Please enter a topic to subscribe');
        return;
    }

    log('INFO', `Subscribing to topic: ${subscribeTopic.value}`);
    client.subscribe(subscribeTopic.value, (err) => {
        if (err) {
            log('ERROR', 'Subscribe error:', err);
            alert('Failed to subscribe: ' + err.message);
        } else {
            log('SUCCESS', `Subscribed to: ${subscribeTopic.value}`);
        }
    });
});

// Publish button handler
publishBtn.addEventListener('click', () => {
    if (!publishTopic.value || !publishMessage.value) {
        alert('Please enter both topic and message');
        return;
    }

    log('INFO', `Publishing to ${publishTopic.value}:`, publishMessage.value);
    client.publish(publishTopic.value, publishMessage.value, (err) => {
        if (err) {
            log('ERROR', 'Publish error:', err);
            alert('Failed to publish: ' + err.message);
        } else {
            log('SUCCESS', 'Message published successfully');
        }
    });
});

// Helper function to update UI elements based on connection state
function setConnectedState(connected) {
    connectBtn.disabled = connected;
    disconnectBtn.disabled = !connected;
    subscribeBtn.disabled = !connected;
    publishBtn.disabled = !connected;
}
