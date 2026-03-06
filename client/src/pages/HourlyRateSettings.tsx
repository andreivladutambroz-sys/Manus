import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Clock, TrendingUp, Calculator } from 'lucide-react';

interface MechanicRate {
  hourlyRate: number;
  currency: string;
  lastUpdated: Date;
}

interface RepairEstimate {
  hourlyRate: number;
  currency: string;
  estimatedHours: number;
  laborCost: number;
  partsPrice: number;
  partsMarkup: number;
  totalCost: number;
  breakdown: {
    labor: string;
    parts: string;
    markup: string;
    total: string;
  };
}

export function HourlyRateSettings() {
  const [currentRate, setCurrentRate] = useState<MechanicRate>({
    hourlyRate: 50,
    currency: 'USD',
    lastUpdated: new Date()
  });

  const [newRate, setNewRate] = useState(currentRate.hourlyRate.toString());
  const [currency, setCurrency] = useState(currentRate.currency);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Repair cost calculator
  const [estimatedHours, setEstimatedHours] = useState('2');
  const [partsPrice, setPartsPrice] = useState('0');
  const [markupPercentage, setMarkupPercentage] = useState('20');
  const [estimate, setEstimate] = useState<RepairEstimate | null>(null);

  useEffect(() => {
    // Load current rate from API
    loadCurrentRate();
  }, []);

  const loadCurrentRate = async () => {
    try {
      // In production, call: const rate = await trpc.mechanicRates.getMyRate.query();
      // For now, use mock data
      setCurrentRate({
        hourlyRate: 50,
        currency: 'USD',
        lastUpdated: new Date()
      });
      setNewRate('50');
    } catch (error) {
      console.error('Failed to load rate:', error);
    }
  };

  const handleSaveRate = async () => {
    setIsSaving(true);
    try {
      const rate = parseFloat(newRate);
      if (rate < 15 || rate > 500) {
        setMessage('Rate must be between $15 and $500 per hour');
        return;
      }

      // In production, call: await trpc.mechanicRates.setHourlyRate.mutate({ hourlyRate: rate, currency });
      setCurrentRate({
        hourlyRate: rate,
        currency,
        lastUpdated: new Date()
      });
      setMessage('✅ Hourly rate updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Failed to save rate');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCalculateEstimate = async () => {
    try {
      const hours = parseFloat(estimatedHours);
      const parts = parseFloat(partsPrice);
      const markup = parseFloat(markupPercentage);

      if (hours <= 0) {
        setMessage('Hours must be greater than 0');
        return;
      }

      // In production, call: const result = await trpc.mechanicRates.calculateRepairCost.query({ ... });
      const laborCost = currentRate.hourlyRate * hours;
      const partsMarkup = parts * (markup / 100);
      const totalCost = laborCost + parts + partsMarkup;

      setEstimate({
        hourlyRate: currentRate.hourlyRate,
        currency: currentRate.currency,
        estimatedHours: hours,
        laborCost: Math.round(laborCost * 100) / 100,
        partsPrice: parts,
        partsMarkup: Math.round(partsMarkup * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        breakdown: {
          labor: `${currentRate.currency} ${Math.round(laborCost * 100) / 100}`,
          parts: `${currentRate.currency} ${parts}`,
          markup: `${currentRate.currency} ${Math.round(partsMarkup * 100) / 100}`,
          total: `${currentRate.currency} ${Math.round(totalCost * 100) / 100}`
        }
      });
    } catch (error) {
      setMessage('❌ Failed to calculate estimate');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Hourly Rate Settings</h1>
        <p className="text-muted-foreground">Configure your labor rate for repair cost calculations</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rate">My Hourly Rate</TabsTrigger>
          <TabsTrigger value="calculator">Cost Calculator</TabsTrigger>
        </TabsList>

        {/* Rate Configuration Tab */}
        <TabsContent value="rate" className="space-y-4">
          {/* Current Rate Card */}
          <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-green-500/10 border-blue-500/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Current Hourly Rate</p>
                    <p className="text-3xl font-bold text-foreground">
                      {currentRate.currency} {currentRate.hourlyRate}/hr
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium text-foreground">
                    {currentRate.lastUpdated.toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Per 8-hour Day</p>
                  <p className="text-lg font-bold text-foreground">
                    {currentRate.currency} {currentRate.hourlyRate * 8}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Per 40-hour Week</p>
                  <p className="text-lg font-bold text-foreground">
                    {currentRate.currency} {currentRate.hourlyRate * 40}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Per 160-hour Month</p>
                  <p className="text-lg font-bold text-foreground">
                    {currentRate.currency} {currentRate.hourlyRate * 160}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Update Rate Form */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Update Your Rate</h3>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Hourly Rate ({currency})
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-3 text-muted-foreground">{currency}</span>
                    <Input
                      type="number"
                      min="15"
                      max="500"
                      step="5"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      className="pl-10"
                      placeholder="50"
                    />
                  </div>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="px-3 py-2 rounded-md border border-input bg-background text-foreground"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum: $15/hr | Maximum: $500/hr
                </p>
              </div>

              {message && (
                <div className={`p-3 rounded-md text-sm ${
                  message.includes('✅') 
                    ? 'bg-green-500/10 text-green-600' 
                    : 'bg-red-500/10 text-red-600'
                }`}>
                  {message}
                </div>
              )}

              <Button
                onClick={handleSaveRate}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? 'Saving...' : 'Save Hourly Rate'}
              </Button>
            </div>
          </Card>

          {/* Industry Standards */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Industry Standards</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Apprentice Mechanic</span>
                <Badge variant="outline">$25-35/hr</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Certified Technician</span>
                <Badge variant="outline">$40-60/hr</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Master Mechanic</span>
                <Badge variant="outline">$65-85/hr</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Specialist/ASE Certified</span>
                <Badge variant="outline">$90-120/hr</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Cost Calculator Tab */}
        <TabsContent value="calculator" className="space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Repair Cost Estimator
            </h3>

            <div className="space-y-4">
              {/* Estimated Hours */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Estimated Labor Hours
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    placeholder="2"
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-muted text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{parseFloat(estimatedHours) * currentRate.hourlyRate} {currentRate.currency}</span>
                  </div>
                </div>
              </div>

              {/* Parts Price */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Parts Cost ({currentRate.currency})
                </label>
                <Input
                  type="number"
                  min="0"
                  step="10"
                  value={partsPrice}
                  onChange={(e) => setPartsPrice(e.target.value)}
                  placeholder="0"
                />
              </div>

              {/* Markup Percentage */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Parts Markup (%)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={markupPercentage}
                    onChange={(e) => setMarkupPercentage(e.target.value)}
                    placeholder="20"
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-muted text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">{currentRate.currency} {(parseFloat(partsPrice) * parseFloat(markupPercentage) / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Button onClick={handleCalculateEstimate} className="w-full">
                Calculate Estimate
              </Button>
            </div>
          </Card>

          {/* Estimate Result */}
          {estimate && (
            <Card className="p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Repair Cost Estimate</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-muted-foreground">Labor ({estimate.estimatedHours}h @ {estimate.currency} {estimate.hourlyRate}/hr)</span>
                  <span className="font-semibold text-foreground">{estimate.breakdown.labor}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-muted-foreground">Parts Cost</span>
                  <span className="font-semibold text-foreground">{estimate.breakdown.parts}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-muted-foreground">Parts Markup ({markupPercentage}%)</span>
                  <span className="font-semibold text-foreground">{estimate.breakdown.markup}</span>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <span className="text-lg font-semibold text-foreground">Total Estimate</span>
                  <span className="text-2xl font-bold text-green-600">{estimate.breakdown.total}</span>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
