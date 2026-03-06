import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit2, AlertCircle, TrendingDown, Package } from 'lucide-react';

interface Part {
  id: string;
  name: string;
  partNumber: string;
  category: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  unitCost: number;
  supplier: string;
  lastRestocked: Date;
  reorderPoint: number;
  autoReorder: boolean;
}

const CATEGORIES = [
  'Filters',
  'Belts & Hoses',
  'Spark Plugs',
  'Batteries',
  'Brake Pads',
  'Oil & Fluids',
  'Sensors',
  'Gaskets & Seals',
  'Electrical',
  'Other'
];

const MOCK_PARTS: Part[] = [
  {
    id: '1',
    name: 'Oil Filter',
    partNumber: 'OF-001',
    category: 'Filters',
    quantity: 12,
    minStock: 5,
    maxStock: 20,
    unitCost: 8.50,
    supplier: 'AutoParts Direct',
    lastRestocked: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    reorderPoint: 5,
    autoReorder: true
  },
  {
    id: '2',
    name: 'Spark Plug Set',
    partNumber: 'SP-004',
    category: 'Spark Plugs',
    quantity: 3,
    minStock: 5,
    maxStock: 15,
    unitCost: 12.00,
    supplier: 'NGK Parts',
    lastRestocked: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    reorderPoint: 5,
    autoReorder: true
  },
  {
    id: '3',
    name: 'Brake Pads (Front)',
    partNumber: 'BP-F-002',
    category: 'Brake Pads',
    quantity: 8,
    minStock: 4,
    maxStock: 12,
    unitCost: 25.00,
    supplier: 'Brembo',
    lastRestocked: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    reorderPoint: 4,
    autoReorder: false
  }
];

export function PartsInventory() {
  const [parts, setParts] = useState<Part[]>(MOCK_PARTS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    partNumber: '',
    category: 'Other',
    quantity: 0,
    minStock: 5,
    maxStock: 20,
    unitCost: 0,
    supplier: '',
    autoReorder: true
  });

  const lowStockParts = parts.filter(p => p.quantity <= p.reorderPoint);
  const outOfStockParts = parts.filter(p => p.quantity === 0);
  const totalValue = parts.reduce((sum, p) => sum + (p.quantity * p.unitCost), 0);

  const handleAddPart = () => {
    if (!formData.name || !formData.partNumber) return;

    const newPart: Part = {
      id: Date.now().toString(),
      ...formData,
      lastRestocked: new Date(),
      reorderPoint: formData.minStock
    };

    setParts([...parts, newPart]);
    setFormData({
      name: '',
      partNumber: '',
      category: 'Other',
      quantity: 0,
      minStock: 5,
      maxStock: 20,
      unitCost: 0,
      supplier: '',
      autoReorder: true
    });
    setIsDialogOpen(false);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setParts(parts.map(p => {
      if (p.id === id) {
        return {
          ...p,
          quantity: Math.max(0, p.quantity + delta)
        };
      }
      return p;
    }));
  };

  const handleDeletePart = (id: string) => {
    setParts(parts.filter(p => p.id !== id));
  };

  const handleAutoReorder = (id: string) => {
    setParts(parts.map(p => {
      if (p.id === id) {
        return { ...p, autoReorder: !p.autoReorder };
      }
      return p;
    }));
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Parts Inventory</h1>
          <p className="text-muted-foreground">Track and manage your automotive parts stock</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Parts</p>
                <p className="text-2xl font-bold text-foreground">{parts.length}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inventory Value</p>
                <p className="text-2xl font-bold text-foreground">${totalValue.toFixed(2)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </Card>

          <Card className="p-4 border-orange-500/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-orange-600">{lowStockParts.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600 opacity-50" />
            </div>
          </Card>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Part
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Part</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Part Name
                </label>
                <Input
                  placeholder="e.g., Oil Filter"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Part Number
                </label>
                <Input
                  placeholder="e.g., OF-001"
                  value={formData.partNumber}
                  onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border border-border rounded-md bg-background text-foreground text-sm"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Initial Quantity
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Unit Cost
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Min Stock
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Max Stock
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.maxStock}
                    onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Supplier
                </label>
                <Input
                  placeholder="e.g., AutoParts Direct"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoReorder"
                  checked={formData.autoReorder}
                  onChange={(e) => setFormData({ ...formData, autoReorder: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="autoReorder" className="text-sm font-medium text-foreground">
                  Enable auto-reorder
                </label>
              </div>

              <Button onClick={handleAddPart} className="w-full">
                Add Part
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Parts ({parts.length})</TabsTrigger>
          <TabsTrigger value="low">Low Stock ({lowStockParts.length})</TabsTrigger>
          <TabsTrigger value="out">Out of Stock ({outOfStockParts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {parts.map(part => (
            <Card key={part.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{part.name}</h3>
                  <p className="text-sm text-muted-foreground">{part.partNumber}</p>
                </div>
                <Badge variant="outline">{part.category}</Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Quantity</p>
                  <p className="font-semibold text-foreground">{part.quantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Unit Cost</p>
                  <p className="font-semibold text-foreground">${part.unitCost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Value</p>
                  <p className="font-semibold text-foreground">${(part.quantity * part.unitCost).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Supplier</p>
                  <p className="font-semibold text-foreground">{part.supplier}</p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateQuantity(part.id, -1)}
                >
                  -
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateQuantity(part.id, 1)}
                >
                  +
                </Button>
                <Button
                  variant={part.autoReorder ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAutoReorder(part.id)}
                >
                  {part.autoReorder ? 'Auto-Reorder ON' : 'Auto-Reorder OFF'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeletePart(part.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="low" className="space-y-3">
          {lowStockParts.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No low stock items</p>
            </Card>
          ) : (
            lowStockParts.map(part => (
              <Card key={part.id} className="p-4 border-orange-500/50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{part.name}</h3>
                    <p className="text-sm text-orange-600">Only {part.quantity} in stock (min: {part.minStock})</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Reorder
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="out" className="space-y-3">
          {outOfStockParts.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No out of stock items</p>
            </Card>
          ) : (
            outOfStockParts.map(part => (
              <Card key={part.id} className="p-4 border-red-500/50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{part.name}</h3>
                    <p className="text-sm text-red-600">Out of stock</p>
                  </div>
                  <Button size="sm">
                    Reorder Now
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
