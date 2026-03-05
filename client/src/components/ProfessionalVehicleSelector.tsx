import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Grid, Zap, Gauge, Users, Fuel } from "lucide-react";

interface EngineVariant {
  id: string;
  engine: string;
  engineType: string;
  power: string;
  torque: string;
  transmission: string;
  bodyStyle: string;
  length: string;
  seats: number;
  fuelConsumption: string;
  co2: string;
  acceleration: string;
  topSpeed: string;
  tankCapacity: string;
  driveType: string;
}

interface ProfessionalVehicleSelectorProps {
  brand: string;
  model: string;
  variants: EngineVariant[];
  onSelectVariant: (variant: EngineVariant) => void;
  selectedVariant?: EngineVariant;
}

export function ProfessionalVehicleSelector({
  brand,
  model,
  variants,
  onSelectVariant,
  selectedVariant,
}: ProfessionalVehicleSelectorProps) {
  const [selectedId, setSelectedId] = useState<string>("");

  // Group variants by engine type
  const groupedVariants = useMemo(() => {
    const groups: Record<string, EngineVariant[]> = {};
    variants.forEach((v) => {
      if (!groups[v.engineType]) {
        groups[v.engineType] = [];
      }
      groups[v.engineType].push(v);
    });
    return groups;
  }, [variants]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const variant = variants.find((v) => v.id === id);
    if (variant) {
      onSelectVariant(variant);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
        <CardHeader>
          <CardTitle className="text-2xl">
            {brand} {model}
          </CardTitle>
          <CardDescription>
            Professional vehicle specifications - Select engine variant
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Engine Variant Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Engine Variants</CardTitle>
          <CardDescription>Choose your vehicle configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedId} onValueChange={handleSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select engine variant..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(groupedVariants).map(([engineType, typeVariants]) => (
                <div key={engineType}>
                  {typeVariants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{variant.engine}</span>
                        <Badge variant="outline" className="text-xs">
                          {variant.power}
                        </Badge>
                        <span className="text-xs text-gray-500">{variant.transmission}</span>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Detailed Specifications Grid */}
      {selectedVariant && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Engine Specs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                Engine Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Engine</p>
                  <p className="text-sm font-semibold">{selectedVariant.engine}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Type</p>
                  <p className="text-sm font-semibold">{selectedVariant.engineType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Power</p>
                  <p className="text-sm font-semibold text-blue-600">{selectedVariant.power}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Torque</p>
                  <p className="text-sm font-semibold text-blue-600">{selectedVariant.torque}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Specs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Gauge className="w-5 h-5 text-red-600" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-medium">0-100 km/h</p>
                  <p className="text-sm font-semibold">{selectedVariant.acceleration}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Top Speed</p>
                  <p className="text-sm font-semibold">{selectedVariant.topSpeed}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Transmission</p>
                  <p className="text-sm font-semibold">{selectedVariant.transmission}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Drive Type</p>
                  <p className="text-sm font-semibold">{selectedVariant.driveType}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consumption & Emissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Fuel className="w-5 h-5 text-green-600" />
                Consumption & Emissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Fuel Consumption</p>
                  <p className="text-sm font-semibold">{selectedVariant.fuelConsumption}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">CO2 Emissions</p>
                  <p className="text-sm font-semibold text-orange-600">{selectedVariant.co2}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Tank Capacity</p>
                  <p className="text-sm font-semibold">{selectedVariant.tankCapacity}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Body & Seating */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Body & Seating
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Body Style</p>
                  <p className="text-sm font-semibold">{selectedVariant.bodyStyle}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Wheelbase</p>
                  <p className="text-sm font-semibold">{selectedVariant.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Seats</p>
                  <p className="text-sm font-semibold">{selectedVariant.seats}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!selectedVariant && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-gray-500">
            <Grid className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Select an engine variant to view detailed specifications</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
