import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, DollarSign, Wrench, AlertTriangle, Lightbulb } from "lucide-react";

interface ModelSpecificProcedure {
  id: string;
  brand: string;
  model: string;
  yearStart: number;
  yearEnd: number;
  engineType: string;
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "moderate" | "difficult" | "expert";
  estimatedTimeMinutes: number;
  estimatedCostMin: number;
  estimatedCostMax: number;
  toolsRequired: string[];
  safetyWarnings: string[];
  modelSpecificWarnings?: string[];
}

interface ModelSpecificProcedureSelectorProps {
  brand: string;
  model: string;
  year: number;
  engineType?: string;
  procedures: ModelSpecificProcedure[];
  onSelectProcedure: (procedure: ModelSpecificProcedure) => void;
}

export function ModelSpecificProcedureSelector({
  brand,
  model,
  year,
  engineType,
  procedures,
  onSelectProcedure,
}: ModelSpecificProcedureSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredProcedures = useMemo(() => {
    return procedures.filter((proc) => {
      const categoryMatch = selectedCategory === "all" || proc.category === selectedCategory;
      const difficultyMatch = selectedDifficulty === "all" || proc.difficulty === selectedDifficulty;
      const searchMatch =
        searchQuery === "" ||
        proc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proc.description.toLowerCase().includes(searchQuery.toLowerCase());

      return categoryMatch && difficultyMatch && searchMatch;
    });
  }, [procedures, selectedCategory, selectedDifficulty, searchQuery]);

  const categories = Array.from(new Set(procedures.map((p) => p.category)));
  const difficulties = ["easy", "moderate", "difficult", "expert"];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "difficult":
        return "bg-orange-100 text-orange-800";
      case "expert":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {brand} {model} ({year}) {engineType && `- ${engineType}`}
        </h2>
        <p className="text-gray-600">
          {filteredProcedures.length} repair procedures available for this vehicle
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Procedures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
              <Input
                placeholder="Search procedures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Difficulty</label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {difficulties.map((diff) => (
                    <SelectItem key={diff} value={diff}>
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Procedures List */}
      <div className="space-y-4">
        {filteredProcedures.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500">No procedures found matching your filters.</p>
            </CardContent>
          </Card>
        ) : (
          filteredProcedures.map((procedure) => (
            <Card key={procedure.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{procedure.title}</CardTitle>
                    <CardDescription>{procedure.description}</CardDescription>
                  </div>
                  <Badge className={getDifficultyColor(procedure.difficulty)}>
                    {procedure.difficulty.charAt(0).toUpperCase() + procedure.difficulty.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {/* Time */}
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-600">Time</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{procedure.estimatedTimeMinutes} min</p>
                  </div>

                  {/* Cost */}
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium text-green-600">Cost</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      €{procedure.estimatedCostMin}-{procedure.estimatedCostMax}
                    </p>
                  </div>

                  {/* Tools */}
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Wrench className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-600">Tools</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{procedure.toolsRequired.length}</p>
                  </div>

                  {/* Category */}
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-medium text-indigo-600">Category</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{procedure.category}</p>
                  </div>
                </div>

                {/* Warnings */}
                {(procedure.safetyWarnings.length > 0 || procedure.modelSpecificWarnings?.length) && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-900 mb-2">Important Warnings</h4>
                        <ul className="space-y-1">
                          {procedure.safetyWarnings.map((warning, idx) => (
                            <li key={`safety-${idx}`} className="text-sm text-red-800">
                              • {warning}
                            </li>
                          ))}
                          {procedure.modelSpecificWarnings?.map((warning, idx) => (
                            <li key={`model-${idx}`} className="text-sm text-red-800">
                              • {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  onClick={() => onSelectProcedure(procedure)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  View Full Procedure
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
