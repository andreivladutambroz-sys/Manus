import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, TrendingUp, Users, BookOpen } from "lucide-react";

interface PossibleCause {
  cause: string;
  probability: number;
  description: string;
}

interface DiagnosticSource {
  source: string;
  url: string;
  title: string;
  content: string;
  relevance: number;
}

interface EnhancedDiagnosticResultsProps {
  diagnosis: string;
  confidence: number;
  possibleCauses: PossibleCause[];
  recommendedActions: string[];
  sources: DiagnosticSource[];
  relatedDiscussions: string[];
  expertOpinions: string[];
}

export function EnhancedDiagnosticResults({
  diagnosis,
  confidence,
  possibleCauses,
  recommendedActions,
  sources,
  relatedDiscussions,
  expertOpinions,
}: EnhancedDiagnosticResultsProps) {
  const confidenceColor = confidence >= 80 ? "text-green-600" : confidence >= 60 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="space-y-6">
      {/* Primary Diagnosis Card */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Primary Diagnosis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg font-semibold text-gray-800">{diagnosis}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Confidence Level</span>
              <span className={`text-lg font-bold ${confidenceColor}`}>{confidence}%</span>
            </div>
            <Progress value={confidence} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="causes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="causes">Causes</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="experts">Experts</TabsTrigger>
        </TabsList>

        {/* Possible Causes Tab */}
        <TabsContent value="causes" className="space-y-4">
          {possibleCauses.map((cause, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{cause.cause}</CardTitle>
                    <CardDescription>{cause.description}</CardDescription>
                  </div>
                  <Badge variant={cause.probability >= 70 ? "default" : "secondary"}>
                    {cause.probability}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={cause.probability} className="h-2" />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Recommended Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Diagnostic Procedure</CardTitle>
              <CardDescription>Follow these steps to verify the diagnosis</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {recommendedActions.map((action, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{action}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          {sources.length > 0 ? (
            sources.map((source, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{source.title}</CardTitle>
                      <CardDescription className="text-xs text-gray-500">{source.source}</CardDescription>
                    </div>
                    <Badge variant="outline">{Math.round(source.relevance * 100)}%</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-700">{source.content.substring(0, 150)}...</p>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Read full discussion <ExternalLink className="w-4 h-4" />
                  </a>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No online sources found for this diagnostic
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Expert Opinions Tab */}
        <TabsContent value="experts" className="space-y-4">
          {expertOpinions.length > 0 ? (
            expertOpinions.map((opinion, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start gap-2">
                    <Users className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <CardTitle className="text-base">Expert Opinion</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{opinion}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No expert opinions available
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Related Discussions */}
      {relatedDiscussions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Related Forum Discussions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {relatedDiscussions.slice(0, 5).map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm p-2 rounded hover:bg-blue-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="truncate">{url.substring(0, 60)}...</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
