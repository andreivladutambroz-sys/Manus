/**
 * Vehicle Search Component
 * Autocomplete search for manufacturers, models, and vehicles
 */

import React, { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Search, X } from "lucide-react";

interface VehicleSearchProps {
  onVehicleSelect?: (vehicle: {
    manufacturer: string;
    model: string;
    year?: number;
    engine?: string;
  }) => void;
  placeholder?: string;
}

export function VehicleSearch({
  onVehicleSelect,
  placeholder = "Search vehicles...",
}: VehicleSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [selectedMfr, setSelectedMfr] = useState<any | null>(null);
  const [selectedModel, setSelectedModel] = useState<any | null>(null);
  const [showMfrDropdown, setShowMfrDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch manufacturers
  const { data: mfrsData, isLoading: mfrsLoading } =
    trpc.vehicleData.getManufacturers.useQuery({ limit: 100 });

  // Fetch models when manufacturer selected
  const { data: modelsData, isLoading: modelsLoading } =
    trpc.vehicleData.getModels.useQuery(
      { manufacturer_id: selectedMfr?.id || 0, limit: 100 },
      { enabled: !!selectedMfr }
    );

  useEffect(() => {
    if (mfrsData) {
      setManufacturers(mfrsData);
    }
  }, [mfrsData]);

  useEffect(() => {
    if (modelsData) {
      setModels(modelsData);
    }
  }, [modelsData]);

  // Handle manufacturer search
  const handleMfrSearch = (query: string) => {
    setSearchQuery(query);
    setShowMfrDropdown(true);

    if (!query) {
      setSelectedMfr(null);
      setSelectedModel(null);
      setModels([]);
    }
  };

  // Filter manufacturers based on search
  const filteredMfrs = manufacturers.filter((mfr) =>
    mfr.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter models based on search
  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectMfr = (mfr: any) => {
    setSelectedMfr(mfr);
    setSearchQuery(mfr.name);
    setShowMfrDropdown(false);
    setSelectedModel(null);
    setShowModelDropdown(true);
  };

  const handleSelectModel = (model: any) => {
    setSelectedModel(model);
    setSearchQuery(`${selectedMfr?.name} ${model.name}`);
    setShowModelDropdown(false);

    if (onVehicleSelect) {
      onVehicleSelect({
        manufacturer: selectedMfr?.name,
        model: model.name,
      });
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setSelectedMfr(null);
    setSelectedModel(null);
    setModels([]);
    setShowMfrDropdown(false);
    setShowModelDropdown(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowMfrDropdown(false);
        setShowModelDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => handleMfrSearch(e.target.value)}
              onFocus={() => {
                if (!selectedMfr) setShowMfrDropdown(true);
                if (selectedMfr && !selectedModel) setShowModelDropdown(true);
              }}
              className="pl-10"
            />
            {searchQuery && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Manufacturers Dropdown */}
        {showMfrDropdown && !selectedMfr && (
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-64 overflow-y-auto">
            {mfrsLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : filteredMfrs.length > 0 ? (
              <div className="divide-y">
                {filteredMfrs.map((mfr) => (
                  <button
                    key={mfr.id}
                    onClick={() => handleSelectMfr(mfr)}
                    className="w-full text-left px-4 py-2 hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">{mfr.name}</div>
                    {mfr.country && (
                      <div className="text-xs text-muted-foreground">
                        {mfr.country}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No manufacturers found
              </div>
            )}
          </Card>
        )}

        {/* Models Dropdown */}
        {showModelDropdown && selectedMfr && (
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-64 overflow-y-auto">
            {modelsLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : filteredModels.length > 0 ? (
              <div className="divide-y">
                {filteredModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleSelectModel(model)}
                    className="w-full text-left px-4 py-2 hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">{model.name}</div>
                    {model.body_type && (
                      <div className="text-xs text-muted-foreground">
                        {model.body_type}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No models found
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Selected Vehicle Display */}
      {selectedMfr && selectedModel && (
        <div className="mt-4 p-4 bg-accent rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">
                {selectedMfr.name} {selectedModel.name}
              </div>
              {selectedModel.body_type && (
                <div className="text-sm text-muted-foreground">
                  {selectedModel.body_type}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
            >
              Change
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
