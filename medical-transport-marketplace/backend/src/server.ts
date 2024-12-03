// backend/src/server.ts
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import cors from 'cors';
import redisClient from './services/redis-client';
import { DataGenerator } from './services/data-generator';
import type { WebSocketMessage } from './types';

dotenv.config();

const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN
}));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Initialize data generator
new DataGenerator();

// WebSocket connection handling
wss.on('connection', async (ws: WebSocket) => {
    console.log('New client connected');

    // Send initial data
    const initialData: WebSocketMessage = {
        type: 'initial',
        requests: await redisClient.getAllRequests(),
        metrics: await redisClient.getMetrics()
    };
    ws.send(JSON.stringify(initialData));

    // Subscribe to Redis channels for real-time updates
    redisClient.subscribe('new_request', (request) => {
        ws.send(JSON.stringify({
            type: 'new_request',
            request
        }));
    });

    redisClient.subscribe('metrics_update', (metrics) => {
        ws.send(JSON.stringify({
            type: 'metrics_update',
            metrics
        }));
    });

    // Handle incoming messages
    ws.on('message', async (rawMessage: WebSocket.RawData) => {
        try {
            const data: WebSocketMessage = JSON.parse(rawMessage.toString());

            switch (data.type) {
                case 'driver_update':
                    if (data.driver) {
                        const driver = {
                            ...data.driver,
                            lastUpdate: new Date().toISOString()
                        };
                        await redisClient.addDriver(driver);
                    }
                    break;

                case 'accept_request':
                    if (data.requestId && data.driverId) {
                        const request = await redisClient.getRequest(data.requestId);
                        const acceptingDriver = await redisClient.getDriver(data.driverId);

                        if (request && acceptingDriver) {
                            await redisClient.updateRequestStatus(data.requestId, 'assigned');

                            // Notify all clients
                            wss.clients.forEach(client => {
                                if (client.readyState === WebSocket.OPEN) {
                                    client.send(JSON.stringify({
                                        type: 'request_assigned',
                                        requestId: data.requestId,
                                        driverId: data.driverId
                                    }));
                                }
                            });
                        }
                    }
                    break;
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});