import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = 'http://localhost:8080/ws';

let stompClient = null;

/**
 * Create and return a connected STOMP client.
 * @param {function} onConnect - called once connected
 * @returns {Client} STOMP client instance
 */
export function createStompClient(onConnect) {
    const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        reconnectDelay: 5000,
        onConnect: () => {
            if (onConnect) onConnect(client);
        },
        onStompError: (frame) => {
            console.error('WebSocket STOMP error:', frame);
        },
    });
    client.activate();
    stompClient = client;
    return client;
}

/**
 * Disconnect the STOMP client.
 */
export function disconnectStomp(client) {
    if (client && client.active) {
        client.deactivate();
    }
}
