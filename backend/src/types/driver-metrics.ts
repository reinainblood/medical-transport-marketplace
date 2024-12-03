export interface DriverMetrics {
  completedTrips: number;
  cancelledTrips: number;
  totalRatings: number;
  ratingSum: number;
  onTimePercentage: number;
  acceptanceRate: number;
  wheelchairTripsCompleted: number;
  averageResponseTime: number;  // in seconds
  lastUpdated: string;
}

export interface TripCompletion {
  requestId: string;
  scheduledTime: string;
  completionTime: string;
  wasOnTime: boolean;
  patientRating?: number;
  patientFeedback?: string;
}

