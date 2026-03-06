import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Bell, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface ScheduledRepair {
  id: string;
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  repairType: string;
  scheduledDate: Date;
  estimatedTime: number;
  reminderEnabled: boolean;
  reminderTime: number; // minutes before
  status: 'scheduled' | 'in-progress' | 'completed';
  notes: string;
}

const REPAIR_TYPES = [
  'Oil Change',
  'Tire Rotation',
  'Brake Service',
  'Engine Diagnostic',
  'Transmission Service',
  'Coolant Flush',
  'Battery Replacement',
  'Filter Replacement',
  'Suspension Work',
  'Electrical Repair'
];

export function RepairScheduler() {
  const [repairs, setRepairs] = useState<ScheduledRepair[]>([
    {
      id: '1',
      vehicleId: 'bmw-320d',
      vehicleMake: 'BMW',
      vehicleModel: '320d',
      repairType: 'Oil Change',
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      estimatedTime: 30,
      reminderEnabled: true,
      reminderTime: 60,
      status: 'scheduled',
      notes: 'Use synthetic oil 5W-30'
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicleMake: '',
    vehicleModel: '',
    repairType: '',
    scheduledDate: '',
    estimatedTime: 60,
    reminderEnabled: true,
    reminderTime: 60,
    notes: ''
  });

  const handleAddRepair = () => {
    if (!formData.vehicleMake || !formData.repairType || !formData.scheduledDate) {
      return;
    }

    const newRepair: ScheduledRepair = {
      id: Date.now().toString(),
      vehicleId: `${formData.vehicleMake.toLowerCase()}-${formData.vehicleModel.toLowerCase()}`,
      vehicleMake: formData.vehicleMake,
      vehicleModel: formData.vehicleModel,
      repairType: formData.repairType,
      scheduledDate: new Date(formData.scheduledDate),
      estimatedTime: formData.estimatedTime,
      reminderEnabled: formData.reminderEnabled,
      reminderTime: formData.reminderTime,
      status: 'scheduled',
      notes: formData.notes
    };

    setRepairs([...repairs, newRepair]);
    setFormData({
      vehicleMake: '',
      vehicleModel: '',
      repairType: '',
      scheduledDate: '',
      estimatedTime: 60,
      reminderEnabled: true,
      reminderTime: 60,
      notes: ''
    });
    setIsDialogOpen(false);
  };

  const handleDeleteRepair = (id: string) => {
    setRepairs(repairs.filter(r => r.id !== id));
  };

  const handleCompleteRepair = (id: string) => {
    setRepairs(repairs.map(r =>
      r.id === id ? { ...r, status: 'completed' as const } : r
    ));
  };

  const upcomingRepairs = repairs
    .filter(r => r.status !== 'completed')
    .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

  const completedRepairs = repairs.filter(r => r.status === 'completed');

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Repair Scheduler</h1>
        <p className="text-muted-foreground">Schedule and track vehicle maintenance</p>
      </div>

      {/* Add Repair Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button size="lg" className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Repair
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule New Repair</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Vehicle Make
              </label>
              <Input
                placeholder="e.g., BMW"
                value={formData.vehicleMake}
                onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Vehicle Model
              </label>
              <Input
                placeholder="e.g., 320d"
                value={formData.vehicleModel}
                onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Repair Type
              </label>
              <Select value={formData.repairType} onValueChange={(value) => setFormData({ ...formData, repairType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select repair type..." />
                </SelectTrigger>
                <SelectContent>
                  {REPAIR_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Scheduled Date
              </label>
              <Input
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Estimated Time (minutes)
              </label>
              <Input
                type="number"
                min="15"
                step="15"
                value={formData.estimatedTime}
                onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reminder"
                checked={formData.reminderEnabled}
                onChange={(e) => setFormData({ ...formData, reminderEnabled: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="reminder" className="text-sm font-medium text-foreground">
                Enable reminder
              </label>
            </div>

            {formData.reminderEnabled && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Remind me (minutes before)
                </label>
                <Select value={formData.reminderTime.toString()} onValueChange={(value) => setFormData({ ...formData, reminderTime: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="1440">1 day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Notes
              </label>
              <textarea
                placeholder="Add any notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground text-sm"
                rows={3}
              />
            </div>

            <Button onClick={handleAddRepair} className="w-full">
              Schedule Repair
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upcoming Repairs */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Upcoming Repairs</h2>
        {upcomingRepairs.length === 0 ? (
          <Card className="p-6 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No repairs scheduled</p>
          </Card>
        ) : (
          upcomingRepairs.map(repair => (
            <Card key={repair.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {repair.vehicleMake} {repair.vehicleModel}
                  </h3>
                  <p className="text-sm text-muted-foreground">{repair.repairType}</p>
                </div>
                <Badge variant="outline">{repair.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {repair.scheduledDate.toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {repair.estimatedTime} min
                </div>
              </div>

              {repair.reminderEnabled && (
                <div className="flex items-center gap-2 text-sm text-foreground bg-muted p-2 rounded">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  Reminder: {repair.reminderTime} min before
                </div>
              )}

              {repair.notes && (
                <p className="text-sm text-muted-foreground italic">"{repair.notes}"</p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCompleteRepair(repair.id)}
                  className="flex-1"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Mark Complete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteRepair(repair.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Completed Repairs */}
      {completedRepairs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Completed</h2>
          {completedRepairs.map(repair => (
            <Card key={repair.id} className="p-4 opacity-60">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {repair.vehicleMake} {repair.vehicleModel}
                  </h3>
                  <p className="text-sm text-muted-foreground">{repair.repairType}</p>
                </div>
                <Badge variant="secondary">Completed</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
