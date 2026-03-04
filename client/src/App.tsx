import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import DiagnosticNew from "./pages/DiagnosticNew";
import DiagnosticDetail from "./pages/DiagnosticDetail";
import VehicleList from "./pages/VehicleList";
import ProfilePage from "./pages/Profile";
import KnowledgeBase from "./pages/KnowledgeBase";
import SwarmMonitoring from "./pages/SwarmMonitoring";
import AgentFineTuning from "./pages/AgentFineTuning";

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
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
