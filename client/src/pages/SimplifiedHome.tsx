import React from 'react';
import { Plus, History, Zap, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/DashboardLayout';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

export function SimplifiedHome() {
  const [, setLocation] = useLocation();
  const { data: diagnostics } = trpc.diagnostic.list.useQuery();
  const { data: vehicles } = trpc.vehicle.list.useQuery();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-slate-700 bg-gradient-to-br from-orange-500/10 to-orange-500/5 hover:from-orange-500/20 hover:to-orange-500/10 cursor-pointer transition"
            onClick={() => setLocation('/diagnostic/new')}>
            <CardContent className="p-6">
              <Plus className="w-8 h-8 text-orange-500 mb-3" />
              <h3 className="font-semibold text-white">New Diagnostic</h3>
              <p className="text-sm text-slate-400 mt-1">Start a new vehicle diagnostic</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-gradient-to-br from-blue-500/10 to-blue-500/5 hover:from-blue-500/20 hover:to-blue-500/10 cursor-pointer transition"
            onClick={() => setLocation('/obd-scanner')}>
            <CardContent className="p-6">
              <Zap className="w-8 h-8 text-blue-500 mb-3" />
              <h3 className="font-semibold text-white">OBD Scanner</h3>
              <p className="text-sm text-slate-400 mt-1">Connect to Bluetooth scanner</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-gradient-to-br from-green-500/10 to-green-500/5 hover:from-green-500/20 hover:to-green-500/10 cursor-pointer transition"
            onClick={() => setLocation('/vehicles')}>
            <CardContent className="p-6">
              <History className="w-8 h-8 text-green-500 mb-3" />
              <h3 className="font-semibold text-white">Vehicles</h3>
              <p className="text-sm text-slate-400 mt-1">View vehicle history</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Diagnostics */}
        {diagnostics && diagnostics.length > 0 && (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle>Recent Diagnostics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {diagnostics.slice(0, 5).map((diag: any) => (
                  <div
                    key={diag.id}
                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded hover:bg-slate-700/50 cursor-pointer transition"
                    onClick={() => setLocation(`/diagnostic/${diag.id}`)}
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{diag.vehicleId}</p>
                      <p className="text-sm text-slate-400">
                        {new Date(diag.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      diag.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {diag.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vehicles Summary */}
        {vehicles && vehicles.length > 0 && (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle>Your Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {vehicles.slice(0, 4).map((vehicle: any) => (
                  <div
                    key={vehicle.id}
                    className="p-4 bg-slate-700/30 rounded border border-slate-700 hover:border-slate-600 cursor-pointer transition"
                    onClick={() => setLocation('/vehicles')}
                  >
                    <p className="text-white font-medium">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-sm text-slate-400">{vehicle.vin}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
