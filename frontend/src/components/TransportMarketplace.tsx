import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, MapPin, Phone, Car, Truck } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import MetricCard from './MetricCard';
import type { TransportRequest, Metrics, WebSocketMessage } from '../types';

interface RequestCardProps {
  request: TransportRequest;
  isAssigned?: boolean;
  onAssign?: (request: TransportRequest) => void;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, isAssigned = false, onAssign }) => (
  <Card className={`
    gradient-border hover:scale-102 transition-all duration-300
    ${isAssigned ? 'opacity-75' : ''}
  `}>
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-lg font-semibold gradient-text">
            {new Date(request.scheduledTime).toLocaleTimeString()}
          </p>
          <p className="text-sm text-blue-400">{request.insuranceCarrier}</p>
        </div>
        <div className="flex items-center gap-2">
          {request.requiresWheelchair && (
            <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded-full flex items-center gap-1">
              <Truck className="w-4 h-4" />
            </span>
          )}
          <span className="bg-green-900 text-green-200 px-2 py-1 rounded-full">
            ${request.payment}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <p className="flex items-center gap-2 text-gray-300">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{request.address}</span>
        </p>
        <p className="flex items-center gap-2 text-gray-300">
          <Phone className="w-4 h-4" />
          <span className="text-sm">{request.phone}</span>
        </p>
        <p className="flex items-center gap-2 text-gray-300">
          <AlertCircle className="w-4 h-4"/>
          <span className="text-sm">{Number(request.distance).toFixed(1)} miles away</span>
        </p>
      </div>

      {!isAssigned && onAssign && (
          <button
              onClick={() => onAssign(request)}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600
                   text-white py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-300 transform hover:translate-y-[-2px]"
        >
          Accept Request
        </button>
      )}
    </CardContent>
  </Card>
);

const TransportMarketplace: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    requestVolume: 0,
    activeDrivers: 0,
    nearbyDrivers: 0
  });

  const [availableRequests, setAvailableRequests] = useState<TransportRequest[]>([]);
  const [assignedRequests, setAssignedRequests] = useState<TransportRequest[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
    const socket = new WebSocket(WS_URL);
    socket.onopen = () => {
      console.log('Connected to server');
    };

    socket.onmessage = (event: MessageEvent) => {
      const data: WebSocketMessage = JSON.parse(event.data);

      switch (data.type) {
        case 'initial':
          if (data.requests) {
            setAvailableRequests(data.requests.filter(r => r.status === 'available'));
          }
          if (data.metrics) {
            setMetrics(data.metrics);
          }
          break;

        case 'new_request':
          if (data.request) {
            setAvailableRequests(prev => [...prev, data.request!]);
          }
          break;

        case 'metrics_update':
          if (data.metrics) {
            setMetrics(data.metrics);
          }
          break;

        case 'request_assigned':
          if (data.requestId) {
            const request = availableRequests.find(r => r.id === data.requestId);
            if (request) {
              setAssignedRequests(prev => [...prev, request]);
              setAvailableRequests(prev => prev.filter(r => r.id !== data.requestId));
            }
          }
          break;
      }
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [availableRequests]);

  const handleAssignRequest = (request: TransportRequest) => {
    if (ws) {
      ws.send(JSON.stringify({
        type: 'accept_request',
        requestId: request.id
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Request Volume (12h)"
            value={metrics.requestVolume}
            icon={Clock}
            gradient="bg-gradient-to-br from-blue-600 to-blue-700"
          />
          <MetricCard
            title="Active Drivers"
            value={metrics.activeDrivers}
            icon={Car}
            gradient="bg-gradient-to-br from-purple-600 to-purple-700"
          />
          <MetricCard
            title="Nearby Drivers"
            value={metrics.nearbyDrivers}
            icon={MapPin}
            gradient="bg-gradient-to-br from-indigo-600 to-indigo-700"
          />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 gradient-text">Available Requests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableRequests.map(request => (
              <RequestCard
                key={request.id}
                request={request}
                onAssign={handleAssignRequest}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 gradient-text">My Scheduled Trips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedRequests.map(request => (
              <RequestCard
                key={request.id}
                request={request}
                isAssigned={true}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportMarketplace;

