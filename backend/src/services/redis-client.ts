import Redis from 'ioredis';
import type { Driver, TransportRequest, Metrics } from '../types';

class RedisClient {
  private client: Redis;
  private subscriber: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.client = new Redis(redisUrl);
    this.subscriber = this.client.duplicate();

    this.subscriber = this.client.duplicate();

    this.client.on('error', (err: Error) => console.error('Redis Client Error:', err));
    this.client.on('connect', () => console.log('Redis Client Connected'));
  }

  async publish(channel: string, message: unknown): Promise<number> {
    return await this.client.publish(channel, JSON.stringify(message));
  }

  async subscribe(channel: string, callback: (data: unknown) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch: string, message: string) => {
      if (ch === channel) {
        callback(JSON.parse(message));
      }
    });
  }

  async addDriver(driver: Driver): Promise<void> {
    const driverData = { ...driver };
    delete driverData.ws; // Remove WebSocket instance before storing
    await this.client.hset(`driver:${driver.id}`, driverData as any);
    await this.client.sadd('active_drivers', driver.id);
  }

  async removeDriver(driverId: string): Promise<void> {
    await this.client.srem('active_drivers', driverId);
    await this.client.del(`driver:${driverId}`);
  }

  async getDriver(driverId: string): Promise<Driver | null> {
    const driver = await this.client.hgetall(`driver:${driverId}`);
    return driver ? (driver as unknown as Driver) : null;
  }

  async getAllDrivers(): Promise<Driver[]> {
    const driverIds = await this.client.smembers('active_drivers');
    const drivers = await Promise.all(
      driverIds.map(id => this.getDriver(id))
    );
    return drivers.filter((d): d is Driver => d !== null);
  }

  async addRequest(request: TransportRequest): Promise<void> {
    await this.client.hset(`request:${request.id}`, request as any);
    await this.client.sadd('active_requests', request.id);
  }

  async removeRequest(requestId: string): Promise<void> {
    await this.client.srem('active_requests', requestId);
    await this.client.del(`request:${requestId}`);
  }

  async updateRequestStatus(requestId: string, status: string): Promise<void> {
    await this.client.hset(`request:${requestId}`, 'status', status);
  }


  async getRequest(requestId: string): Promise<TransportRequest | null> {
    const request = await this.client.hgetall(`request:${requestId}`);
    return request ? (request as unknown as TransportRequest) : null;
  }

  async getAllRequests(): Promise<TransportRequest[]> {
    const requestIds = await this.client.smembers('active_requests');
    const requests = await Promise.all(
      requestIds.map(id => this.getRequest(id))
    );
    return requests.filter((r): r is TransportRequest => r !== null);
  }

  async updateMetrics(metrics: Metrics): Promise<void> {
    await this.client.hmset('metrics', metrics as any);
  }

  async getMetrics(): Promise<Metrics> {
    const metrics = await this.client.hgetall('metrics');
    return {
      requestVolume: parseInt(metrics.requestVolume || '0'),
      activeDrivers: parseInt(metrics.activeDrivers || '0'),
      nearbyDrivers: parseInt(metrics.nearbyDrivers || '0')
    };
  }
}

export default new RedisClient();

