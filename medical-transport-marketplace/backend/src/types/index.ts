export interface Driver {
  id: string;
  name: string;
  vehicle: string;
  photo: string;
  wheelchairCertified: boolean;
  rating: number;
  coordinates: Coordinates;
  scheduledTrips: TransportRequest[];
  status: 'available' | 'busy' | 'offline';
  lastUpdated: string;
  ws?: WebSocket;
}

export interface TransportRequest {
  id: string;
  scheduledTime: string;
  distance: number;
  coordinates: Coordinates;
  address: string;
  phone: string;
  requiresWheelchair: boolean;
  insuranceCarrier: InsuranceCarrier;
  status: RequestStatus;
  createdAt: string;
  payment?: number;
  assignedDriver?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export type InsuranceCarrier = 'Medicare' | 'BlueShield' | 'Medicaid' | 'Private';
export type RequestStatus = 'available' | 'assigned' | 'completed' | 'cancelled';

export interface Metrics {
  requestVolume: number;
  activeDrivers: number;
  nearbyDrivers: number;
}

export interface WebSocketMessage {
  type: MessageType;
  requests?: TransportRequest[];
  request?: TransportRequest;
  metrics?: Metrics;
  requestId?: string;
  driverId?: string;
  driver?: Driver;
}

export type MessageType =
  | 'initial'
  | 'new_request'
  | 'metrics_update'
  | 'request_assigned'
  | 'driver_update'
  | 'accept_request';

export interface DriverMetrics {
  completedTrips: number;
  cancelledTrips: number;
  totalRatings: number;
  ratingSum: number;
  onTimePercentage: number;
  acceptanceRate: number;
  wheelchairTripsCompleted: number;
  averageResponseTime: number;
  onTimeTrips: number;
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