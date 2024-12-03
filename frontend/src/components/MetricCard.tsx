import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

interface MetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  gradient: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, gradient }) => {
  return (
    <Card className={`${gradient} border-none text-white hover:scale-105 transition-transform duration-300`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <span className="text-4xl font-bold">{value}</span>
      </CardContent>
    </Card>
  );
};

export default MetricCard;

