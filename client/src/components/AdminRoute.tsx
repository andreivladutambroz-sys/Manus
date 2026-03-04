import React from 'react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Protected route component that ensures only admins can access
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Card className="border-slate-700 bg-slate-800/50 max-w-md">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-bold text-white">Not Authenticated</h2>
            </div>
            <p className="text-slate-300 mb-6">
              You must be logged in to access the admin dashboard.
            </p>
            <Button
              onClick={() => setLocation('/')}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not admin
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Card className="border-slate-700 bg-slate-800/50 max-w-md">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-bold text-white">Access Denied</h2>
            </div>
            <p className="text-slate-300 mb-6">
              You do not have permission to access the admin dashboard. Admin access is required.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-slate-400">
                Current role: <span className="font-semibold text-orange-400">{user.role}</span>
              </p>
              <p className="text-sm text-slate-400">
                User ID: <span className="font-mono text-slate-500">{user.id}</span>
              </p>
            </div>
            <Button
              onClick={() => setLocation('/')}
              className="w-full mt-6 bg-orange-500 hover:bg-orange-600"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin - render children
  return <>{children}</>;
}
