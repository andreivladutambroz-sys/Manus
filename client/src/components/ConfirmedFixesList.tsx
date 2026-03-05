import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, Flag } from "lucide-react";

interface Fix {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "moderate" | "difficult" | "expert";
  successRate: number;
  upvotes: number;
  downvotes: number;
  averageRating: number;
  views: number;
  helpful: number;
  comments: number;
  verified: boolean;
  featured: boolean;
  submittedBy: string;
  submittedAt: Date;
}

interface ConfirmedFixesListProps {
  fixes: Fix[];
  onVote?: (fixId: string, voteType: "upvote" | "downvote") => void;
  onRate?: (fixId: string, helpful: boolean) => void;
  onComment?: (fixId: string) => void;
  onShare?: (fixId: string) => void;
  onFlag?: (fixId: string) => void;
  onSelectFix?: (fixId: string) => void;
}

export function ConfirmedFixesList({
  fixes,
  onVote,
  onRate,
  onComment,
  onShare,
  onFlag,
  onSelectFix,
}: ConfirmedFixesListProps) {
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

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 75) return "text-blue-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-4">
      {fixes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">No fixes found for this error code.</p>
          </CardContent>
        </Card>
      ) : (
        fixes.map((fix) => (
          <Card
            key={fix.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onSelectFix?.(fix.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {fix.verified && <Badge className="bg-blue-600">Verified</Badge>}
                    {fix.featured && <Badge className="bg-purple-600">Featured</Badge>}
                    <Badge className={getDifficultyColor(fix.difficulty)}>{fix.difficulty}</Badge>
                  </div>
                  <CardTitle className="text-lg">{fix.title}</CardTitle>
                  <CardDescription className="mt-1">{fix.description}</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Success Rate and Rating */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Success Rate</p>
                      <p className={`text-lg font-bold ${getSuccessRateColor(fix.successRate)}`}>
                        {fix.successRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Rating</p>
                      <p className="text-lg font-bold text-yellow-600">★ {fix.averageRating.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Views</p>
                      <p className="text-lg font-bold">{fix.views.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Submitted Info */}
                <div className="text-sm text-gray-500">
                  Submitted by <span className="font-medium">{fix.submittedBy}</span> on{" "}
                  {new Date(fix.submittedAt).toLocaleDateString()}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onVote?.(fix.id, "upvote");
                    }}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {fix.upvotes}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onVote?.(fix.id, "downvote");
                    }}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    {fix.downvotes}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onComment?.(fix.id);
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {fix.comments}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare?.(fix.id);
                    }}
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 ml-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFlag?.(fix.id);
                    }}
                  >
                    <Flag className="w-4 h-4" />
                  </Button>
                </div>

                {/* Helpful Rating */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Was this helpful?</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRate?.(fix.id, true);
                    }}
                  >
                    Yes ({fix.helpful})
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRate?.(fix.id, false);
                    }}
                  >
                    No
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
