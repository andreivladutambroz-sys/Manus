import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Zap, History, BarChart3 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import LanguageSelector from "@/components/LanguageSelector";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const { data: diagnostics } = trpc.diagnostic.list.useQuery();
  const { data: vehicles } = trpc.vehicle.list.useQuery();

  // TEMPORARY: Disable auth check for testing - always show dashboard
  // TODO: Re-enable authentication after testing
  const isAuthDisabledForTesting = true;

  // If not authenticated, show landing page
  if (!isAuthenticated && !isAuthDisabledForTesting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Navigation */}
        <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-orange-500" />
              <span className="text-xl font-bold text-white">Mechanic Helper</span>
            </div>
            <div className="flex gap-3 items-center">
              <LanguageSelector />
              <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => window.location.href = getLoginUrl()}>
                {t("nav.login")}
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              {t("home.title")}
              <span className="block text-orange-500 mt-2">{t("home.titleHighlight")}</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              {t("home.subtitle")}
            </p>
            <Button
              size="lg"
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg"
            >
              {t("home.cta")}
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <Zap className="w-8 h-8 text-orange-500 mb-2" />
                <CardTitle className="text-white">{t("home.feature1.title")}</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                {t("home.feature1.desc")}
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <BarChart3 className="w-8 h-8 text-orange-500 mb-2" />
                <CardTitle className="text-white">{t("home.feature2.title")}</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                {t("home.feature2.desc")}
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <History className="w-8 h-8 text-orange-500 mb-2" />
                <CardTitle className="text-white">{t("home.feature3.title")}</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                {t("home.feature3.desc")}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-700 bg-slate-900 py-8">
          <div className="container mx-auto px-4 text-center text-slate-400">
            <p>&copy; 2026 Mechanic Helper. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  // Authenticated view - Diagnostic dashboard
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-slate-700 bg-gradient-to-br from-orange-500/10 to-orange-500/5 hover:from-orange-500/20 hover:to-orange-500/10 cursor-pointer transition"
            onClick={() => navigate('/diagnostic/new')}>
            <CardContent className="p-6">
              <Plus className="w-8 h-8 text-orange-500 mb-3" />
              <h3 className="font-semibold text-white">New Diagnostic</h3>
              <p className="text-sm text-slate-400 mt-1">Start a new vehicle diagnostic</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-gradient-to-br from-blue-500/10 to-blue-500/5 hover:from-blue-500/20 hover:to-blue-500/10 cursor-pointer transition"
            onClick={() => navigate('/obd-scanner')}>
            <CardContent className="p-6">
              <Zap className="w-8 h-8 text-blue-500 mb-3" />
              <h3 className="font-semibold text-white">OBD Scanner</h3>
              <p className="text-sm text-slate-400 mt-1">Connect to Bluetooth scanner</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-gradient-to-br from-green-500/10 to-green-500/5 hover:from-green-500/20 hover:to-green-500/10 cursor-pointer transition"
            onClick={() => navigate('/vehicles')}>
            <CardContent className="p-6">
              <History className="w-8 h-8 text-green-500 mb-3" />
              <h3 className="font-semibold text-white">Vehicles</h3>
              <p className="text-sm text-slate-400 mt-1">View vehicle history</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Diagnostics */}
        {diagnostics && diagnostics.length > 0 && (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle>Recent Diagnostics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {diagnostics.slice(0, 5).map((diag: any) => (
                  <div
                    key={diag.id}
                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded hover:bg-slate-700/50 cursor-pointer transition"
                    onClick={() => navigate(`/diagnostic/${diag.id}`)}
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{diag.vehicleId}</p>
                      <p className="text-sm text-slate-400">
                        {new Date(diag.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      diag.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {diag.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vehicles Summary */}
        {vehicles && vehicles.length > 0 && (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle>Your Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {vehicles.slice(0, 4).map((vehicle: any) => (
                  <div
                    key={vehicle.id}
                    className="p-4 bg-slate-700/30 rounded border border-slate-700 hover:border-slate-600 cursor-pointer transition"
                    onClick={() => navigate('/vehicles')}
                  >
                    <p className="text-white font-medium">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-sm text-slate-400">{vehicle.vin}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
