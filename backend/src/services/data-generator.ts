// backend/src/services/data-generator.ts
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';
import redisClient from './redis-client';
import type { Driver, TransportRequest, InsuranceCarrier } from '../types';

export class DataGenerator {
  constructor() {
    console.log('Initializing DataGenerator...');
    this.generateInitialData();
    this.startGenerators();
  }

  private async generateInitialData(): Promise<void> {
    console.log('Generating initial data...');
    try {
      // Generate initial pool of drivers
      for (let i = 0; i < 20; i++) {
        await this.generateDriver();
      }
      console.log('Generated 20 drivers');

      // Generate initial requests
      for (let i = 0; i < 10; i++) {
        await this.generateRequest();
      }
      console.log('Generated 10 requests');

      await this.updateMetrics();
      console.log('Initial metrics updated');
    } catch (error) {
      console.error('Error generating initial data:', error);
    }
  }

  private async generateDriver(): Promise<void> {
    const driver: Driver = {
      id: uuidv4(),
      name: faker.person.fullName(),
      vehicle: `${faker.vehicle.manufacturer()} ${faker.vehicle.model()}`,
      photo: faker.image.avatar(),
      wheelchairCertified: Math.random() > 0.7,
      rating: Number((4 + Math.random()).toFixed(1)),
      coordinates: {
        lat: faker.location.latitude(),
        lng: faker.location.longitude()
      },
      scheduledTrips: [],
      status: 'available',
      lastUpdated: new Date().toISOString()
    };

    await redisClient.addDriver(driver);
  }

  private async generateRequest(): Promise<void> {
    const insuranceCarriers: InsuranceCarrier[] = ['Medicare', 'BlueShield', 'Medicaid', 'Private'];

    const request: TransportRequest = {
      id: uuidv4(),
      scheduledTime: faker.date.soon({ days: 1 }).toISOString(),
      distance: Number((2 + Math.random() * 8).toFixed(1)),
      coordinates: {
        lat: faker.location.latitude(),
        lng: faker.location.longitude()
      },
      address: faker.location.streetAddress(true),
      phone: faker.phone.number(),
      requiresWheelchair: Math.random() > 0.7,
      insuranceCarrier: faker.helpers.arrayElement(insuranceCarriers),
      status: 'available',
      createdAt: new Date().toISOString(),
      payment: Number((25 + Math.random() * 50).toFixed(2))
    };

    await redisClient.addRequest(request);
    await redisClient.publish('new_request', request);
  }

  private async updateMetrics(): Promise<void> {
    const drivers = await redisClient.getAllDrivers();
    const requests = await redisClient.getAllRequests();

    const metrics = {
      requestVolume: requests.length,
      activeDrivers: drivers.length,
      nearbyDrivers: Math.floor(drivers.length * 0.4) // Simplified for demo
    };

    await redisClient.updateMetrics(metrics);
    await redisClient.publish('metrics_update', metrics);
  }

  private startGenerators(): void {
    // Generate new requests periodically
    setInterval(async () => {
      if (Math.random() > 0.7) {
        await this.generateRequest();
      }
    }, 5000);

    // Update driver locations periodically
    setInterval(async () => {
      const drivers = await redisClient.getAllDrivers();
      for (const driver of drivers) {
        const updatedDriver = {
          ...driver,
          coordinates: {
            lat: driver.coordinates.lat + (Math.random() - 0.5) * 0.01,
            lng: driver.coordinates.lng + (Math.random() - 0.5) * 0.01
          }
        };
        await redisClient.addDriver(updatedDriver);
      }
    }, 10000);

    // Update metrics periodically
    setInterval(() => this.updateMetrics(), 10000);

    // Clean up old requests
    setInterval(async () => {
      const requests = await redisClient.getAllRequests();
      const now = new Date();
      for (const request of requests) {
        if (now.getTime() - new Date(request.createdAt).getTime() > 24 * 60 * 60 * 1000) {
          // Remove requests older than 24 hours
          await redisClient.removeRequest(request.id);
        }
      }
    }, 60000);
  }
}