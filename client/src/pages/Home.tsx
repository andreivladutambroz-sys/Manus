import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, Database, Shield } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

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
          <div className="flex gap-4">
            {isAuthenticated ? (
              <>
                <Button variant="outline" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
                <Button variant="outline" onClick={() => navigate("/knowledge-base")}>
                  Baza de Cunoștințe
                </Button>
              </>
            ) : (
              <Button onClick={() => window.location.href = getLoginUrl()}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Professional Auto Diagnostics
            <span className="block text-orange-500 mt-2">Powered by AI</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Streamline your diagnostic workflow with intelligent symptom analysis, comprehensive history management, and instant AI-powered recommendations.
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg"
          >
            Get Started <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Zap className="w-8 h-8 text-orange-500 mb-2" />
              <CardTitle className="text-white">AI-Powered Analysis</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              Get intelligent diagnostic suggestions based on vehicle symptoms using advanced AI analysis.
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Database className="w-8 h-8 text-orange-500 mb-2" />
              <CardTitle className="text-white">Complete History</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              Track all diagnostics with searchable history, filters, and detailed reports for every vehicle.
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Shield className="w-8 h-8 text-orange-500 mb-2" />
              <CardTitle className="text-white">Professional Reports</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              Generate and export comprehensive PDF reports for client communication and record-keeping.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">Ready to transform your diagnostics?</h2>
        <Button
          size="lg"
          onClick={handleGetStarted}
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg"
        >
          Start Your Free Trial <ArrowRight className="ml-2 w-5 h-5" />
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
