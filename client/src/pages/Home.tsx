import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, Database, Shield, Brain } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import LanguageSelector from "@/components/LanguageSelector";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      window.location.href = getLoginUrl();
    }
  };

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
            {isAuthenticated ? (
              <>
                <Button variant="outline" className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700" onClick={() => navigate("/dashboard")}>
                  {t("nav.dashboard")}
                </Button>
                <Button variant="outline" className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700" onClick={() => navigate("/knowledge-base")}>
                  {t("nav.knowledgeBase")}
                </Button>
              </>
            ) : (
              <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => window.location.href = getLoginUrl()}>
                {t("nav.login")}
              </Button>
            )}
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
            onClick={handleGetStarted}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg"
          >
            {t("home.cta")} <ArrowRight className="ml-2 w-5 h-5" />
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
              <Database className="w-8 h-8 text-orange-500 mb-2" />
              <CardTitle className="text-white">{t("home.feature2.title")}</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              {t("home.feature2.desc")}
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Brain className="w-8 h-8 text-orange-500 mb-2" />
              <CardTitle className="text-white">{t("home.feature3.title")}</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              {t("home.feature3.desc")}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">{t("home.cta")}</h2>
        <Button
          size="lg"
          onClick={handleGetStarted}
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg"
        >
          {t("nav.getStarted")} <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
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
