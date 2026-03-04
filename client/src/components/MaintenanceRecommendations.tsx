import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface MaintenanceRecommendationsProps {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmissionType: string;
  driveType: string;
}

export function MaintenanceRecommendations({
  brand,
  model,
  year,
  mileage,
  fuelType,
  transmissionType,
  driveType,
}: MaintenanceRecommendationsProps) {
  const [showMaintenance, setShowMaintenance] = useState(false);

  const { data: schedule, isLoading: scheduleLoading } = trpc.ai.maintenance.useQuery(
    {
      brand,
      model,
      year,
      mileage,
      fuelType,
      transmissionType,
      driveType,
      useCache: true,
    },
    { enabled: showMaintenance }
  );

  const { data: overdueServices, isLoading: overdueLoading } = trpc.ai.overdueServices.useQuery(
    {
      brand,
      model,
      year,
      mileage,
      fuelType,
      transmissionType,
      driveType,
    },
    { enabled: showMaintenance }
  );

  const isLoading = scheduleLoading || overdueLoading;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setShowMaintenance(!showMaintenance)}
        variant="outline"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading Maintenance Schedule...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {showMaintenance ? 'Hide' : 'Show'} Maintenance Schedule
          </>
        )}
      </Button>

      {showMaintenance && (
        <div className="space-y-4">
          {/* Overdue Services */}
          {overdueServices && overdueServices.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-base text-red-900">
                  ⚠️ Overdue Services
                </CardTitle>
                <CardDescription className="text-red-800">
                  These services are overdue based on your current mileage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overdueServices.map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-white rounded border border-red-200"
                    >
                      <span className="font-medium text-red-900">{service.service}</span>
                      <Badge variant="destructive">{service.priority}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Full Schedule */}
          {schedule && schedule.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-700">
                Complete Maintenance Schedule
              </h3>
              {schedule.map((item, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getPriorityIcon(item.priority)}
                        <div>
                          <CardTitle className="text-base">{item.service}</CardTitle>
                          <CardDescription className="mt-1">
                            {item.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Due At */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Due at Mileage</p>
                        <p className="font-semibold">
                          {item.dueAt.mileage.toLocaleString()} km
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Or After</p>
                        <p className="font-semibold">{item.dueAt.months} months</p>
                      </div>
                    </div>

                    {/* Parts */}
                    {item.partsNeeded.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Parts Needed</p>
                        <div className="flex flex-wrap gap-2">
                          {item.partsNeeded.map((part, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {part}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cost & Time */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Cost</p>
                        <p className="font-semibold">
                          ${item.estimatedCost.min}-${item.estimatedCost.max}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Time</p>
                        <p className="font-semibold">{item.estimatedTime}h</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Priority</p>
                        <p className="font-semibold capitalize">{item.priority}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            !isLoading && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600">
                    No maintenance schedule available.
                  </p>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
