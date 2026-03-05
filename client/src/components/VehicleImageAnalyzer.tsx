import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, AlertTriangle, Upload, Loader2 } from "lucide-react";

interface VisionAnalysisResult {
  defectsDetected: string[];
  damageLevel: "none" | "minor" | "moderate" | "severe";
  confidence: number;
  recommendations: string[];
  estimatedRepairCost: {
    min: number;
    max: number;
    currency: string;
  };
  detailedAnalysis: string;
}

interface VehicleImageAnalyzerProps {
  brand: string;
  model: string;
  year?: number;
  onAnalysisComplete?: (result: VisionAnalysisResult) => void;
}

export function VehicleImageAnalyzer({
  brand,
  model,
  year,
  onAnalysisComplete,
}: VehicleImageAnalyzerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<VisionAnalysisResult | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !preview) return;

    setIsAnalyzing(true);
    try {
      // Upload image and get analysis
      // This would call your backend API
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("brand", brand);
      formData.append("model", model);
      formData.append("year", year?.toString() || "");

      // Mock analysis result for now
      const mockResult: VisionAnalysisResult = {
        defectsDetected: [
          "Minor paint scratches on front bumper",
          "Slight dent on driver side door",
          "Windshield has small chip",
        ],
        damageLevel: "minor",
        confidence: 87,
        recommendations: [
          "Touch up paint scratches with touch-up pen",
          "Consider PDR (Paintless Dent Repair) for door dent",
          "Replace windshield due to safety concerns",
        ],
        estimatedRepairCost: {
          min: 300,
          max: 800,
          currency: "EUR",
        },
        detailedAnalysis:
          "The vehicle shows minor cosmetic damage typical of daily use. The windshield chip is the most concerning issue from a safety perspective and should be addressed promptly.",
      };

      setAnalysis(mockResult);
      onAnalysisComplete?.(mockResult);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getDamageLevelColor = (level: string) => {
    switch (level) {
      case "none":
        return "text-green-600";
      case "minor":
        return "text-yellow-600";
      case "moderate":
        return "text-orange-600";
      case "severe":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getDamageLevelIcon = (level: string) => {
    switch (level) {
      case "none":
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case "minor":
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case "moderate":
        return <AlertCircle className="w-6 h-6 text-orange-600" />;
      case "severe":
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Vehicle Image Analysis
          </CardTitle>
          <CardDescription>
            Upload a photo of your {brand} {model} for AI-powered damage assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Input */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </label>
          </div>

          {/* Preview */}
          {preview && (
            <div className="space-y-4">
              <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Image"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Damage Level Card */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getDamageLevelIcon(analysis.damageLevel)}
                  <div>
                    <CardTitle className="text-lg capitalize">
                      {analysis.damageLevel} Damage
                    </CardTitle>
                  </div>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {analysis.confidence}% Confidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={analysis.confidence} className="h-2" />
            </CardContent>
          </Card>

          {/* Defects Detected */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Defects Detected</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.defectsDetected.map((defect, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0" />
                    <span>{defect}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Repair Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Repair Cost Estimate */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardHeader>
              <CardTitle className="text-base">Estimated Repair Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Minimum</p>
                  <p className="text-2xl font-bold text-green-600">
                    €{analysis.estimatedRepairCost.min}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Maximum</p>
                  <p className="text-2xl font-bold text-orange-600">
                    €{analysis.estimatedRepairCost.max}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detailed Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">
                {analysis.detailedAnalysis}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
