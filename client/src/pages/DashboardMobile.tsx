import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, TrendingUp, AlertCircle, CheckCircle2, Clock, Zap,
  Activity, Download, Share2, Eye
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { RESPONSIVE_TEXT, RESPONSIVE_SPACING, RESPONSIVE_GRID } from "@/lib/mobile-utils";

export default function DashboardMobile() {
  const [, navigate] = useLocation();
  const { data: diagnostics, isLoading } = trpc.diagnostic.list.useQuery();
  const { data: vehicles } = trpc.vehicle.list.useQuery();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className={`${RESPONSIVE_SPACING.CONTAINER_PADDING} py-6 animate-pulse`}>
          <div className="h-8 bg-muted rounded mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const stats = {
    totalDiagnostics: diagnostics?.length || 0,
    completed: diagnostics?.filter((d) => d.status === "completed").length || 0,
    inProgress: diagnostics?.filter((d) => d.status === "in_progress").length || 0,
    vehicles: vehicles?.length || 0,
  };

  const completionRate = stats.totalDiagnostics > 0
    ? Math.round((stats.completed / stats.totalDiagnostics) * 100)
    : 0;

  return (
    <DashboardLayout>
      <div className={`${RESPONSIVE_SPACING.CONTAINER_PADDING} py-4 sm:py-6`}>
        {/* Header */}
        <div className="mb-6">
          <h1 className={`${RESPONSIVE_TEXT.H2} text-foreground mb-2`}>Dashboard</h1>
          <p className={`${RESPONSIVE_TEXT.BODY} text-muted-foreground`}>
            Your diagnostic overview
          </p>
        </div>

        {/* Stats Grid - Mobile Optimized */}
        <div className={`grid ${RESPONSIVE_GRID.COLS_2_3_4} ${RESPONSIVE_SPACING.GRID_GAP} mb-6`}>
          {/* Total Diagnostics */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {stats.totalDiagnostics}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* Completed */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Completed</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {stats.completed}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* In Progress */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">In Progress</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">
                    {stats.inProgress}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* Vehicles */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Vehicles</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">
                    {stats.vehicles}
                  </p>
                </div>
                <Zap className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Completion Rate */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{completionRate}%</span>
                <span className="text-xs text-muted-foreground">
                  {stats.completed} of {stats.totalDiagnostics}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diagnostics List */}
        <div className="mb-6">
          <h2 className={`${RESPONSIVE_TEXT.H3} text-foreground mb-4`}>Recent Diagnostics</h2>

          {diagnostics && diagnostics.length > 0 ? (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="all" className="text-xs sm:text-sm">
                  All
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-xs sm:text-sm">
                  Done
                </TabsTrigger>
                <TabsTrigger value="progress" className="text-xs sm:text-sm">
                  In Progress
                </TabsTrigger>
              </TabsList>

              {/* All Diagnostics */}
              <TabsContent value="all" className="space-y-2">
                {diagnostics.map((diagnostic) => (
                  <Card
                    key={diagnostic.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/diagnostic/${diagnostic.id}`)}
                  >
                    <CardContent className="py-3 sm:py-4">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-medium text-foreground">
                            Diagnostic #{diagnostic.id}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {new Date(diagnostic.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            diagnostic.status === "completed" ? "default" : "secondary"
                          }
                          className="text-xs flex-shrink-0"
                        >
                          {diagnostic.status === "completed" ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Done
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              In Progress
                            </>
                          )}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Completed Diagnostics */}
              <TabsContent value="completed" className="space-y-2">
                {diagnostics
                  .filter((d) => d.status === "completed")
                  .map((diagnostic) => (
                    <Card
                      key={diagnostic.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/diagnostic/${diagnostic.id}`)}
                    >
                      <CardContent className="py-3 sm:py-4">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-medium text-foreground">
                              Diagnostic #{diagnostic.id}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {new Date(diagnostic.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className="text-xs flex-shrink-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Done
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>

              {/* In Progress Diagnostics */}
              <TabsContent value="progress" className="space-y-2">
                {diagnostics
                  .filter((d) => d.status === "in_progress")
                  .map((diagnostic) => (
                    <Card
                      key={diagnostic.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/diagnostic/${diagnostic.id}`)}
                    >
                      <CardContent className="py-3 sm:py-4">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-medium text-foreground">
                              Diagnostic #{diagnostic.id}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {new Date(diagnostic.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            <Clock className="w-3 h-3 mr-1" />
                            In Progress
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground mb-4">No diagnostics yet</p>
              <Button
                onClick={() => navigate("/diagnostic/new")}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Create First Diagnostic
              </Button>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <Button
            onClick={() => navigate("/diagnostic/new")}
            className="bg-orange-500 hover:bg-orange-600 h-12 text-base font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Diagnostic
          </Button>
          <Button
            onClick={() => navigate("/vehicles")}
            variant="outline"
            className="h-12 text-base font-medium"
          >
            <Eye className="w-4 h-4 mr-2" />
            Vehicles
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

import { Plus } from "lucide-react";
