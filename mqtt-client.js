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
const protocolSelect = document.getElementById('protocol-select');
const brokerPort = document.getElementById('broker-port');
const autoScrollCheckbox = document.getElementById('auto-scroll');
const logFilter = document.getElementById('log-filter');
const openLogsBtn = document.getElementById('open-logs-btn');
const unsubscribeBtn = document.getElementById('unsubscribe-btn');
const downloadLogsBtn = document.getElementById('download-logs-btn');
let logsWindow = null;
let selectedFilters = Array.from(logFilter.selectedOptions).map(opt => opt.value);

let notificationsEnabled = false;

// Request notification permission
if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
        notificationsEnabled = permission === 'granted';
    });
}

function showNotification(title, options = {}) {
    if (notificationsEnabled) {
        const notification = new Notification(title, {
            icon: 'app-icon.png',
            ...options
        });
        
        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);
    }
}

function isSecureContext() {
    return window.location.protocol === 'https:';
}

function validateAndFormatUrl(host, port, protocol) {
    try {
        if (!host) throw new Error('Broker address is required');
        
        // Handle TCP (mqtt://) connections
        if (protocol === 'mqtt' || protocol === 'mqtts') {
            return `${protocol}://${host}:${port || '1883'}`;
        }
        
        // Handle WebSocket connections
        if (isSecureContext() && protocol === 'ws') {
            protocol = 'wss';
            port = port || '8084';
        } else {
            port = port || (protocol === 'wss' ? '8084' : '8083');
        }
        
        return `${protocol}://${host}:${port}/mqtt`;
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

// Update placeholder to show MQTT support
brokerUrl.placeholder = isSecureContext() ? 
    'wss://broker.emqx.io:8084 or mqtt://broker.emqx.io:1883' : 
    'broker.emqx.io:1883 or ws://broker.emqx.io:8083';

// Log filter change handler
logFilter.addEventListener('change', () => {
    selectedFilters = Array.from(logFilter.selectedOptions).map(opt => opt.value);
    updateVisibleMessages();
});

function updateVisibleMessages() {
    const messages = document.querySelectorAll('.message');
    messages.forEach(msg => {
        const type = msg.className.split(' ')[1];
        msg.classList.toggle('hidden', !selectedFilters.includes(type));
    });
}

// Set compile timestamp
document.getElementById('compile-time').textContent = new Date().toLocaleString();

function smoothScroll(element, target) {
    element.scrollTo({
        top: target,
        behavior: 'smooth'
    });
}

const messagesContainer = messagesDiv.parentElement;
let isScrolling = false;

function scrollToBottom(smooth = true) {
    if (!autoScrollCheckbox.checked || isScrolling) return;
    
    isScrolling = true;
    const scrollTarget = messagesDiv.offsetHeight - messagesContainer.offsetHeight;
    
    if (scrollTarget > 0) {
        messagesContainer.scrollTo({
            top: scrollTarget,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }
    
    // Reset scroll flag after animation
    setTimeout(() => {
        isScrolling = false;
    }, 100);
}

// Update log function
function log(type, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [${type}] ${message}`;
    console.log(logMessage, data || '');
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type.toLowerCase()}`;
    if (!selectedFilters.includes(type.toLowerCase())) {
        messageElement.classList.add('hidden');
    }
    messageElement.textContent = logMessage;
    
    messagesDiv.appendChild(messageElement);
    scrollToBottom();
    
    // Send to separate logs window if open
    if (logsWindow && !logsWindow.closed) {
        logsWindow.postMessage({
            type: 'log',
            message: logMessage,
            className: messageElement.className
        }, '*');
    }
}

// Create Intersection Observer to monitor scroll position
const scrollObserver = new IntersectionObserver(
    (entries) => {
        if (autoScrollCheckbox.checked && !isScrolling) {
            scrollToBottom(false);
        }
    },
    { root: messagesContainer, threshold: 1.0 }
);

// Observe the last message
const observeLastMessage = () => {
    const messages = messagesDiv.children;
    if (messages.length > 0) {
        scrollObserver.disconnect();
        scrollObserver.observe(messages[messages.length - 1]);
    }
};

// Update observer when new messages are added
const originalAppendChild = messagesDiv.appendChild;
messagesDiv.appendChild = function(child) {
    const result = originalAppendChild.call(this, child);
    observeLastMessage();
    return result;
};

// Update placeholder based on selected protocol
protocolSelect.addEventListener('change', () => {
    const protocol = protocolSelect.value;
    brokerPort.value = protocol.includes('s') ? '8884' : '1883';
});

// Connect button handler
connectBtn.addEventListener('click', () => {
    if (!brokerUrl.value) {
        alert('Please enter a broker address');
        return;
    }

    try {
        const protocol = protocolSelect.value;
        const host = brokerUrl.value.replace(/^[a-z]+:\/\//, '').replace(/\/.*$/, '');
        const port = brokerPort.value;
        
        const formattedUrl = validateAndFormatUrl(host, port, protocol);
        const options = {
            protocol: protocol,
            hostname: host,
            port: port,
            path: '/mqtt',
            protocolVersion: 4,
            keepalive: 60,
            clean: true,
            reconnectPeriod: 1000,
            connectTimeout: 5000,
            rejectUnauthorized: false
        };
        
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
            showNotification('MQTT Connected', {
                body: `Connected to ${brokerUrl.value}`,
                tag: 'mqtt-connection'
            });
        });

        client.on('error', (err) => {
            log('ERROR', 'Connection error:', err);
            statusDiv.textContent = 'Status: Error - ' + err.message;
            setConnectedState(false);
            showNotification('MQTT Error', {
                body: err.message,
                tag: 'mqtt-error'
            });
        });

        client.on('close', () => {
            log('WARN', 'Connection closed');
            statusDiv.textContent = 'Status: Disconnected';
            setConnectedState(false);
            showNotification('MQTT Disconnected', {
                body: `Disconnected from ${brokerUrl.value}`,
                tag: 'mqtt-connection'
            });
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

// Add unsubscribe handler
unsubscribeBtn.addEventListener('click', () => {
    if (!subscribeTopic.value) {
        alert('Please enter a topic to unsubscribe');
        return;
    }

    log('INFO', `Unsubscribing from topic: ${subscribeTopic.value}`);
    client.unsubscribe(subscribeTopic.value, (err) => {
        if (err) {
            log('ERROR', 'Unsubscribe error:', err);
            alert('Failed to unsubscribe: ' + err.message);
        } else {
            log('SUCCESS', `Unsubscribed from: ${subscribeTopic.value}`);
        }
    });
});

// Add download handler
downloadLogsBtn.addEventListener('click', () => {
    const messages = Array.from(messagesDiv.children)
        .filter(msg => !msg.classList.contains('hidden'))
        .map(msg => msg.textContent)
        .join('\n');
    
    const blob = new Blob([messages], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `mqtt-logs-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    log('SUCCESS', 'Logs downloaded successfully');
});

// Helper function to update UI elements based on connection state
function setConnectedState(connected) {
    connectBtn.disabled = connected;
    disconnectBtn.disabled = !connected;
    subscribeBtn.disabled = !connected;
    unsubscribeBtn.disabled = !connected;
    publishBtn.disabled = !connected;
}
