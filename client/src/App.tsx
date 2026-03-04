import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { I18nProvider } from "./lib/i18n";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import DiagnosticNew from "./pages/DiagnosticNew";
import DiagnosticDetail from "./pages/DiagnosticDetail";
import VehicleList from "./pages/VehicleList";
import ProfilePage from "./pages/Profile";
import KnowledgeBase from "./pages/KnowledgeBase";
import SwarmMonitoring from "./pages/SwarmMonitoring";
import AgentFineTuning from "./pages/AgentFineTuning";
import DiagnosticFeedback from "./pages/DiagnosticFeedback";
import LearningDashboard from "./pages/LearningDashboard";
import AdminKnowledgeBase from "./pages/AdminKnowledgeBase";
import DiagnosticChat from "./pages/DiagnosticChat";
import OBDScanner from "./pages/OBDScanner";
import { AIChatbot } from "./components/AIChatbot";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/diagnostic/new"} component={DiagnosticNew} />
      <Route path={"/diagnostic/:id"} component={DiagnosticDetail} />
      <Route path={"/vehicles"} component={VehicleList} />
      <Route path={"/profile"} component={ProfilePage} />
      <Route path={"/knowledge-base"} component={KnowledgeBase} />
      <Route path={"/swarm-monitoring"} component={SwarmMonitoring} />
      <Route path={"/agent-fine-tuning"} component={AgentFineTuning} />
      <Route path={"/diagnostic/:id/feedback"} component={DiagnosticFeedback} />
      <Route path={"/learning"} component={LearningDashboard} />
      <Route path={"/admin/knowledge-base"} component={AdminKnowledgeBase} />
      <Route path={"/diagnostic-chat"} component={DiagnosticChat} />
      <Route path={"/obd-scanner"} component={OBDScanner} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Router />
            <AIChatbot />
          </TooltipProvider>
        </ThemeProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;
