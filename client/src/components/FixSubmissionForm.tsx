import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, X } from "lucide-react";

interface FixSubmissionFormProps {
  errorCode?: string;
  brand?: string;
  model?: string;
  onSubmit?: (fix: any) => void;
  onCancel?: () => void;
}

export function FixSubmissionForm({ errorCode, brand, model, onSubmit, onCancel }: FixSubmissionFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    solution: "",
    difficulty: "moderate",
    estimatedTime: "",
    estimatedCost: "",
    toolsRequired: [] as string[],
    partsNeeded: [] as { partNumber: string; name: string; cost: number }[],
    photos: [] as string[],
  });

  const [toolInput, setToolInput] = useState("");
  const [partInput, setPartInput] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [partCost, setPartCost] = useState("");

  const handleAddTool = () => {
    if (toolInput.trim()) {
      setFormData({
        ...formData,
        toolsRequired: [...formData.toolsRequired, toolInput.trim()],
      });
      setToolInput("");
    }
  };

  const handleRemoveTool = (index: number) => {
    setFormData({
      ...formData,
      toolsRequired: formData.toolsRequired.filter((_, i) => i !== index),
    });
  };

  const handleAddPart = () => {
    if (partInput.trim() && partNumber.trim()) {
      setFormData({
        ...formData,
        partsNeeded: [
          ...formData.partsNeeded,
          {
            partNumber: partNumber.trim(),
            name: partInput.trim(),
            cost: parseFloat(partCost) || 0,
          },
        ],
      });
      setPartInput("");
      setPartNumber("");
      setPartCost("");
    }
  };

  const handleRemovePart = (index: number) => {
    setFormData({
      ...formData,
      partsNeeded: formData.partsNeeded.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({
      ...formData,
      errorCode,
      brand,
      model,
      estimatedTime: parseInt(formData.estimatedTime) || 0,
      estimatedCost: parseFloat(formData.estimatedCost) || 0,
    });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Submit a Fix</CardTitle>
        <CardDescription>Share your solution for {errorCode} with the community</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Fix Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., MAF Sensor Cleaning Fixed P0101"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What was the problem and how did you diagnose it?"
              rows={4}
              required
            />
          </div>

          {/* Solution */}
          <div>
            <label className="block text-sm font-medium mb-2">Step-by-Step Solution</label>
            <Textarea
              value={formData.solution}
              onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
              placeholder="1. Remove air intake hose&#10;2. Locate MAF sensor&#10;3. Clean with MAF sensor cleaner&#10;4. Reinstall and clear codes"
              rows={6}
              required
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium mb-2">Difficulty Level</label>
            <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="difficult">Difficult</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time and Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Estimated Time (minutes)</label>
              <Input
                type="number"
                value={formData.estimatedTime}
                onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                placeholder="45"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Estimated Cost ($)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                placeholder="85.00"
              />
            </div>
          </div>

          {/* Tools Required */}
          <div>
            <label className="block text-sm font-medium mb-2">Tools Required</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={toolInput}
                onChange={(e) => setToolInput(e.target.value)}
                placeholder="e.g., Screwdriver set"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTool();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTool} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.toolsRequired.map((tool, index) => (
                <Badge key={index} variant="secondary" className="gap-2">
                  {tool}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => handleRemoveTool(index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Parts Needed */}
          <div>
            <label className="block text-sm font-medium mb-2">Parts Needed</label>
            <div className="space-y-2 mb-2">
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  placeholder="Part Number"
                />
                <Input
                  value={partInput}
                  onChange={(e) => setPartInput(e.target.value)}
                  placeholder="Part Name"
                />
                <Input
                  type="number"
                  step="0.01"
                  value={partCost}
                  onChange={(e) => setPartCost(e.target.value)}
                  placeholder="Cost"
                />
              </div>
              <Button type="button" onClick={handleAddPart} variant="outline" className="w-full">
                Add Part
              </Button>
            </div>
            <div className="space-y-2">
              {formData.partsNeeded.map((part, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{part.name}</p>
                    <p className="text-sm text-gray-600">Part #: {part.partNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">${part.cost.toFixed(2)}</p>
                    <X
                      className="w-4 h-4 cursor-pointer text-red-600"
                      onClick={() => handleRemovePart(index)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Add Photos (Optional)</label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Drag and drop photos or click to upload</p>
              <Input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                id="photo-upload"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Submit Fix
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
