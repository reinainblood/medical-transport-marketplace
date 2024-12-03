import { Redis } from 'ioredis';
import type { Driver, DriverMetrics, TripCompletion } from '../types';

export class DriverMetricsService {
  constructor(private redis: Redis) {}

  private getDriverMetricsKey(driverId: string): string {
    return `driver:${driverId}:metrics`;
  }

  private getDriverHistoryKey(driverId: string): string {
    return `driver:${driverId}:history`;
  }


// Change all hincr to hincrby
async updateDriverRating(driverId: string, rating: number): Promise<void> {
  const metricsKey = this.getDriverMetricsKey(driverId);
  await this.redis.hincrby(metricsKey, 'totalRatings', 1);
  await this.redis.hincrby(metricsKey, 'ratingSum', rating);

  // Update the average rating in the main driver hash
  const metrics = await this.getDriverMetrics(driverId);
  const avgRating = metrics.ratingSum / metrics.totalRatings;
  await this.redis.hset(`driver:${driverId}`, 'rating', avgRating.toFixed(1));
}

  async recordTripCompletion(driverId: string, completion: TripCompletion): Promise<void> {
    const metricsKey = this.getDriverMetricsKey(driverId);
    const historyKey = this.getDriverHistoryKey(driverId);

    // Store the completion record in the driver's history
    await this.redis.lpush(historyKey, JSON.stringify(completion));
    // Keep last 100 trips only
    await this.redis.ltrim(historyKey, 0, 99);

    // Update metrics
    await this.redis.hincrby(metricsKey, 'completedTrips', 1);
    if (completion.wasOnTime) {
      await this.redis.hincrby(metricsKey, 'onTimeTrips', 1);
    }

    if (completion.patientRating) {
      await this.updateDriverRating(driverId, completion.patientRating);
    }

    // Update overall metrics
    const metrics = await this.getDriverMetrics(driverId);
    const onTimePercentage = (metrics.onTimeTrips / metrics.completedTrips) * 100;
    await this.redis.hset(metricsKey, 'onTimePercentage', onTimePercentage.toFixed(1));
  }

  async getDriverMetrics(driverId: string): Promise<DriverMetrics> {
    const metricsKey = this.getDriverMetricsKey(driverId);
    const metrics = await this.redis.hgetall(metricsKey);

    return {
      completedTrips: parseInt(metrics.completedTrips || '0'),
      onTimeTrips: parseInt(metrics.onTimeTrips || '0'),
      cancelledTrips: parseInt(metrics.cancelledTrips || '0'),
      totalRatings: parseInt(metrics.totalRatings || '0'),
      ratingSum: parseFloat(metrics.ratingSum || '0'),
      onTimePercentage: parseFloat(metrics.onTimePercentage || '0'),
      acceptanceRate: parseFloat(metrics.acceptanceRate || '0'),
      wheelchairTripsCompleted: parseInt(metrics.wheelchairTripsCompleted || '0'),
      averageResponseTime: parseFloat(metrics.averageResponseTime || '0'),
      lastUpdated: metrics.lastUpdated || new Date().toISOString()
    };
  }

  async getDriverHistory(driverId: string, limit: number = 10): Promise<TripCompletion[]> {
    const historyKey = this.getDriverHistoryKey(driverId);
    const history = await this.redis.lrange(historyKey, 0, limit - 1);
    return history.map(item => JSON.parse(item));
  }

  async calculateDriverScore(driverId: string): Promise<number> {
    const metrics = await this.getDriverMetrics(driverId);

    const weights = {
      rating: 0.3,
      onTime: 0.25,
      acceptance: 0.2,
      experience: 0.15,
      responseTime: 0.1
    };

    const ratingScore = metrics.ratingSum / (metrics.totalRatings * 5);
    const onTimeScore = metrics.onTimePercentage / 100;
    const acceptanceScore = metrics.acceptanceRate / 100;
    const experienceScore = Math.min(metrics.completedTrips / 1000, 1);
    const responseScore = Math.max(0, 1 - (metrics.averageResponseTime / 60));

    const totalScore = (
      (ratingScore * weights.rating) +
      (onTimeScore * weights.onTime) +
      (acceptanceScore * weights.acceptance) +
      (experienceScore * weights.experience) +
      (responseScore * weights.responseTime)
    );

    return Number(totalScore.toFixed(4));
  }

  async initializeDriverMetrics(driverId: string): Promise<void> {
    const metricsKey = this.getDriverMetricsKey(driverId);
    const initialMetrics: DriverMetrics = {
      completedTrips: 0,
      cancelledTrips: 0,
      onTimeTrips: 0,
      totalRatings: 0,
      ratingSum: 0,
      onTimePercentage: 100,
      acceptanceRate: 100,
      wheelchairTripsCompleted: 0,
      averageResponseTime: 0,
      lastUpdated: new Date().toISOString()
    };

    await this.redis.hmset(metricsKey, initialMetrics as any);
  }
}

