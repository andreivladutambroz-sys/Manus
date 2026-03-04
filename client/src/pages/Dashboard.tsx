import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Plus, Search, Zap, User, Brain } from "lucide-react";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-lg text-slate-600 mb-4">Please sign in to access the dashboard</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const { data: diagnostics, isLoading } = trpc.diagnostic.list.useQuery();
  const { data: vehicles } = trpc.vehicle.list.useQuery();

  const filteredDiagnostics = diagnostics?.filter(d => {
    const vehicle = vehicles?.find(v => v.id === d.vehicleId);
    return (
      vehicle?.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle?.model.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-600">Bun venit din nou, {user?.name || "Mecanic"}</p>
            </div>
            <div className="flex gap-2 items-center">
              <NotificationCenter />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/profile")}
              >
                <User className="w-4 h-4 mr-2" />
                Profil
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/knowledge-base")}
              >
                Baza de Cunoștințe
              </Button>
              <Button
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
                onClick={() => navigate("/learning")}
              >
                <Brain className="w-4 h-4 mr-2" />
                AI Learning
              </Button>
              <Button
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={() => navigate("/diagnostic-chat")}
              >
                Chat AI
              </Button>
              <Button
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
                onClick={() => navigate("/admin/knowledge-base")}
              >
                Admin KB
              </Button>
              <Button
                onClick={() => navigate("/diagnostic/new")}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Diagnostic Nou
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Diagnostics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{diagnostics?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Vehicles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{vehicles?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {diagnostics?.filter(d => d.status === "completed").length || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by vehicle brand or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Diagnostics List */}
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Diagnostice Recente</h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : filteredDiagnostics.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-slate-600 mb-4">No diagnostics found</p>
                <Button
                  onClick={() => navigate("/diagnostic/new")}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Create Your First Diagnostic
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredDiagnostics.map(diagnostic => {
              const vehicle = vehicles?.find(v => v.id === diagnostic.vehicleId);
              return (
                <Card
                  key={diagnostic.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/diagnostic/${diagnostic.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          {vehicle?.brand} {vehicle?.model} ({vehicle?.year})
                        </h3>
                        <p className="text-sm text-slate-600">
                          {diagnostic.symptomsText?.substring(0, 100)}...
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(diagnostic.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          diagnostic.status === "completed" ? "bg-green-100 text-green-800" :
                          diagnostic.status === "saved" ? "bg-blue-100 text-blue-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {diagnostic.status}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
