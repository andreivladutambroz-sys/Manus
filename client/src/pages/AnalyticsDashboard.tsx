import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, AlertCircle, Wrench, DollarSign } from 'lucide-react';

const MOCK_DATA = {
  stats: {
    totalDiagnostics: 1878,
    uniqueMakes: 32,
    uniqueModels: 287,
    uniqueCodes: 87,
    avgConfidence: 0.82
  },
  topCodes: [
    { code: 'P0171', count: 156, desc: 'System Too Lean' },
    { code: 'P0300', count: 142, desc: 'Random Misfire' },
    { code: 'P0420', count: 128, desc: 'Catalyst System' },
    { code: 'P0128', count: 98, desc: 'Coolant Thermostat' },
    { code: 'P0505', count: 87, desc: 'Idle Control' }
  ],
  topSymptoms: [
    { symptom: 'Check Engine Light', count: 1245 },
    { symptom: 'Rough Idle', count: 892 },
    { symptom: 'Engine Knock', count: 756 },
    { symptom: 'Poor Fuel Economy', count: 634 },
    { symptom: 'Hesitation', count: 598 }
  ],
  topMakes: [
    { make: 'BMW', count: 285 },
    { make: 'Toyota', count: 198 },
    { make: 'Mercedes', count: 176 },
    { make: 'Ford', count: 165 },
    { make: 'Honda', count: 154 }
  ],
  confidenceDistribution: [
    { range: '0.70-0.75', count: 287 },
    { range: '0.75-0.80', count: 456 },
    { range: '0.80-0.85', count: 612 },
    { range: '0.85-0.90', count: 398 },
    { range: '0.90-0.95', count: 225 }
  ],
  collectionTrend: [
    { date: 'Mar 1', records: 150 },
    { date: 'Mar 2', records: 280 },
    { date: 'Mar 3', records: 420 },
    { date: 'Mar 4', records: 580 },
    { date: 'Mar 5', records: 750 },
    { date: 'Mar 6', records: 1878 }
  ]
};

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export function AnalyticsDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Swarm data collection metrics and insights</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Records</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {MOCK_DATA.stats.totalDiagnostics.toLocaleString()}
              </p>
            </div>
            <Activity className="h-8 w-8 text-blue-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Vehicle Makes</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {MOCK_DATA.stats.uniqueMakes}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Error Codes</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {MOCK_DATA.stats.uniqueCodes}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {Math.round(MOCK_DATA.stats.avgConfidence * 100)}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Data Quality</p>
              <p className="text-2xl font-bold text-foreground mt-1">100%</p>
            </div>
            <Wrench className="h-8 w-8 text-orange-500 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="codes">Error Codes</TabsTrigger>
          <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Collection Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={MOCK_DATA.collectionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="records" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Confidence Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={MOCK_DATA.confidenceDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="range" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Error Codes Tab */}
        <TabsContent value="codes" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top Error Codes</h3>
            <div className="space-y-3">
              {MOCK_DATA.topCodes.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-mono font-bold text-foreground">{item.code}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <Badge variant="secondary">{item.count} records</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Code Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={MOCK_DATA.topCodes}
                  dataKey="count"
                  nameKey="code"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {MOCK_DATA.topCodes.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Symptoms Tab */}
        <TabsContent value="symptoms" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top Symptoms</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={MOCK_DATA.topSymptoms} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="symptom" type="category" stroke="#6b7280" width={150} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Vehicles Tab */}
        <TabsContent value="vehicles" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top Vehicle Makes</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={MOCK_DATA.topMakes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="make" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Make Distribution</h3>
            <div className="space-y-2">
              {MOCK_DATA.topMakes.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-foreground">{item.make}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(item.count / 285) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
