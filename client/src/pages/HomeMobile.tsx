// @ts-nocheck
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Zap, History, BarChart3, Menu, X } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { RESPONSIVE_TEXT, RESPONSIVE_SPACING, RESPONSIVE_GRID } from "@/lib/mobile-utils";

export default function HomeMobile() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: diagnostics } = trpc.diagnostic.list.useQuery();
  const { data: vehicles } = trpc.vehicle.list.useQuery();

  // If not authenticated, show landing page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Mobile Navigation */}
        <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
          <div className={`${RESPONSIVE_SPACING.CONTAINER_PADDING} py-3 flex justify-between items-center`}>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
              <span className="text-lg sm:text-xl font-bold text-white">Mechanic Helper</span>
            </div>
            <div className="flex gap-2 sm:gap-3 items-center">
              <div className="hidden sm:block">
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  {t("nav.login")}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="sm:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="border-t border-slate-700 bg-slate-800 sm:hidden">
              <div className={`${RESPONSIVE_SPACING.CONTAINER_PADDING} py-3`}>
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  {t("nav.login")}
                </Button>
              </div>
            </div>
          )}
        </nav>

        {/* Hero Section - Mobile Optimized */}
        <section className={`${RESPONSIVE_SPACING.CONTAINER_PADDING} py-12 sm:py-20`}>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className={`${RESPONSIVE_TEXT.H1} text-white mb-4 sm:mb-6`}>
              {t("home.title")}
              <span className="block text-orange-500 mt-2 sm:mt-3">{t("home.titleHighlight")}</span>
            </h1>
            <p className={`${RESPONSIVE_TEXT.BODY} text-slate-300 mb-6 sm:mb-8`}>
              {t("home.subtitle")}
            </p>
            <Button
              size="lg"
              onClick={() => (window.location.href = getLoginUrl())}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 sm:px-8 py-3 sm:py-6 text-base sm:text-lg font-medium"
            >
              {t("home.cta")}
            </Button>
          </div>
        </section>

        {/* Features Section - Mobile Optimized */}
        <section className={`${RESPONSIVE_SPACING.CONTAINER_PADDING} py-12 sm:py-20`}>
          <div className={`grid ${RESPONSIVE_GRID.COLS_1_2_3} ${RESPONSIVE_SPACING.GRID_GAP}`}>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mb-2" />
                <CardTitle className="text-white text-base sm:text-lg">{t("home.feature1.title")}</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 text-sm sm:text-base">
                {t("home.feature1.desc")}
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mb-2" />
                <CardTitle className="text-white text-base sm:text-lg">{t("home.feature2.title")}</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 text-sm sm:text-base">
                {t("home.feature2.desc")}
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <History className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mb-2" />
                <CardTitle className="text-white text-base sm:text-lg">{t("home.feature3.title")}</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 text-sm sm:text-base">
                {t("home.feature3.desc")}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-700 bg-slate-900 py-6 sm:py-8">
          <div className={`${RESPONSIVE_SPACING.CONTAINER_PADDING} text-center text-slate-400 text-xs sm:text-sm`}>
            <p>&copy; 2026 Mechanic Helper. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  // Authenticated view
  return (
    <DashboardLayout>
      <div className={`${RESPONSIVE_SPACING.CONTAINER_PADDING} py-6 sm:py-8`}>
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className={`${RESPONSIVE_TEXT.H2} text-foreground mb-2`}>Welcome Back</h1>
          <p className={`${RESPONSIVE_TEXT.BODY} text-muted-foreground`}>
            Manage your vehicle diagnostics and repairs
          </p>
        </div>

        {/* Quick Actions - Mobile Optimized */}
        <div className={`grid ${RESPONSIVE_GRID.COLS_1_2_3} ${RESPONSIVE_SPACING.GRID_GAP} mb-8`}>
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/diagnostic/new")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <Plus className="w-5 h-5 text-orange-500" />
                <CardTitle className="text-base sm:text-lg">New Diagnostic</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Start a new vehicle diagnostic
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/obd-scanner")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-base sm:text-lg">OBD Scanner</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Connect Bluetooth scanner
            </CardContent>
          </Card>

            <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/dashboard")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <History className="w-5 h-5 text-green-500" />
                <CardTitle className="text-base sm:text-lg">History</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              View your diagnostic history
            </CardContent>
          </Card>
        </div>

        {/* Recent Diagnostics */}
        {diagnostics && diagnostics.length > 0 && (
          <div className="mb-8">
            <h2 className={`${RESPONSIVE_TEXT.H3} text-foreground mb-4`}>Recent Diagnostics</h2>
            <div className={`space-y-2 sm:space-y-3`}>
              {diagnostics.slice(0, 5).map((diagnostic) => (
                <Card
                  key={diagnostic.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/diagnostic/${diagnostic.id}`)}
                >
                  <CardContent className="py-3 sm:py-4">
                    <div className="flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-foreground truncate">
                          Diagnostic #{diagnostic.id}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {new Date(diagnostic.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-green-600 ml-2 flex-shrink-0">
                        {diagnostic.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Your Vehicles */}
        {vehicles && vehicles.length > 0 && (
          <div>
            <h2 className={`${RESPONSIVE_TEXT.H3} text-foreground mb-4`}>Your Vehicles</h2>
            <div className={`grid ${RESPONSIVE_GRID.COLS_1_2} ${RESPONSIVE_SPACING.GRID_GAP}`}>
              {vehicles.slice(0, 4).map((vehicle) => (
                <Card
                  key={vehicle.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate("/vehicles")}
                >
                  <CardContent className="py-3 sm:py-4">
                    <p className="text-sm sm:text-base font-medium text-foreground">
                      {vehicle.year} {vehicle.brand} {vehicle.model}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {vehicle.vin || "No VIN"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
