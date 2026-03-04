import React from 'react';
import { ArrowRight, Zap, BarChart3, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

function getLoginUrl() {
  const appId = import.meta.env.VITE_APP_ID;
  const portalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const redirectUrl = `${window.location.origin}/api/oauth/callback`;
  return `${portalUrl}/login?app_id=${appId}&redirect_uri=${encodeURIComponent(redirectUrl)}`;
}
import { useLocation } from 'wouter';

export function Landing() {
  const { data: user } = trpc.auth.me.useQuery();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (user) {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  if (user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-8 h-8 text-orange-500" />
            <span className="text-xl font-bold text-white">Mechanic Helper</span>
          </div>
          <a href={getLoginUrl()} className="text-sm text-slate-300 hover:text-white transition">
            Login
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Professional Auto Diagnostics
              <span className="text-orange-500"> Powered by AI</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Streamline your diagnostic workflow with intelligent symptom analysis, comprehensive history management, and instant AI-powered recommendations.
            </p>
            <div className="flex gap-4">
              <a href={getLoginUrl()}>
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
              <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                Learn More
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-2xl blur-3xl"></div>
            <div className="relative bg-slate-800/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="h-12 bg-slate-700/50 rounded-lg animate-pulse"></div>
                <div className="h-12 bg-slate-700/50 rounded-lg animate-pulse"></div>
                <div className="h-12 bg-slate-700/50 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <Card className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition">
            <CardContent className="p-8">
              <Brain className="w-12 h-12 text-orange-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">AI-Powered Analysis</h3>
              <p className="text-slate-300">
                Intelligent symptom analysis with machine learning-powered diagnostic suggestions
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition">
            <CardContent className="p-8">
              <BarChart3 className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Real-time Collaboration</h3>
              <p className="text-slate-300">
                Work together with your team on diagnostics with live presence and activity tracking
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition">
            <CardContent className="p-8">
              <Zap className="w-12 h-12 text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">OBD-II Integration</h3>
              <p className="text-slate-300">
                Direct Bluetooth connection to OBD-II scanners for real-time error code reading
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-orange-500/10 to-blue-500/10 border border-slate-700 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to streamline your diagnostics?</h2>
          <p className="text-slate-300 mb-8">Start with a free account and experience the future of auto diagnostics</p>
          <a href={getLoginUrl()}>
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
              Sign In Now <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50 mt-20 py-8">
        <div className="container max-w-6xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>&copy; 2026 Mechanic Helper. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
