import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MotorizationSelectorProps {
  onSelect: (motorization: {
    engineName: string;
    engineCode: string;
    engineType: string;
    power: string;
    torque: string;
  }) => void;
  brand?: string;
  model?: string;
  year?: number;
}

export function MotorizationSelector({
  onSelect,
  brand,
  model,
  year,
}: MotorizationSelectorProps) {
  const [selectedMotorization, setSelectedMotorization] = useState<string>('');

  // Fetch motorizations for selected brand/model
  const { data: motorizations = [], isLoading } = trpc.vehicle.getMotorizations.useQuery(
    {
      brand: brand || '',
      model: model || '',
      year: year || new Date().getFullYear(),
    },
    {
      enabled: !!brand && !!model,
    }
  );

  const handleSelect = (motorId: string) => {
    setSelectedMotorization(motorId);
    const selected = motorizations.find((m) => m.id.toString() === motorId);
    if (selected) {
      onSelect({
        engineName: selected.engineName || '',
        engineCode: selected.engineCode || '',
        engineType: selected.engineType || '',
        power: selected.power || '',
        torque: selected.torque || '',
      });
    }
  };

  if (!brand || !model) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Motorization</CardTitle>
          <CardDescription>Select brand and model first</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Engine Motorization</CardTitle>
        <CardDescription>
          Select the official engine variant for {brand} {model}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="text-sm text-muted-foreground">Loading motorizations...</div>
          </div>
        ) : motorizations.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <div className="text-sm text-muted-foreground">
              No motorizations found for this vehicle
            </div>
          </div>
        ) : (
          <Select value={selectedMotorization} onValueChange={handleSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select motorization..." />
            </SelectTrigger>
            <SelectContent>
              {motorizations.map((motorization) => (
                <SelectItem key={motorization.id} value={motorization.id.toString()}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{motorization.engineName}</span>
                    <span className="text-xs text-muted-foreground">
                      ({motorization.engineCode})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedMotorization && motorizations.length > 0 && (
          <div className="mt-4 space-y-2 rounded-lg bg-muted p-3">
            {(() => {
              const selected = motorizations.find((m) => m.id.toString() === selectedMotorization);
              if (!selected) return null;

              return (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Engine Code:</span>
                    <span className="font-mono font-semibold">{selected.engineCode || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-semibold">{selected.engineType || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Power:</span>
                    <span className="font-semibold">{selected.power || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Torque:</span>
                    <span className="font-semibold">{selected.torque || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fuel:</span>
                    <span className="font-semibold">{selected.fuelType || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transmission:</span>
                    <span className="font-semibold">{selected.transmission || 'N/A'}</span>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
