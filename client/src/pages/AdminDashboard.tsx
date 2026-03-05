import React from 'react';
import { Settings, Users, BarChart3, Database, Zap, Shield, FileText, Brain, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/DashboardLayout';
import { trpc } from '@/lib/trpc';
import { AdminRoute } from '@/components/AdminRoute';
import { DataImportDashboard } from '@/components/DataImportDashboard';

export function AdminDashboard() {
  return (
    <AdminRoute>
      <AdminDashboardContent />
    </AdminRoute>
  );
}

function AdminDashboardContent() {
  const { data: stats } = trpc.collaboration.getStats.useQuery();
  const { data: sessions } = trpc.collaboration.getActiveSessions.useQuery();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400 mt-1">System configuration and management</p>
          </div>
          <Shield className="w-8 h-8 text-orange-500" />
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Sessions</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalSessions || 0}</p>
                </div>
                <Zap className="w-8 h-8 text-orange-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Users</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Avg Users/Session</p>
                  <p className="text-2xl font-bold text-white">{stats?.avgUsersPerSession || 0}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">System Status</p>
                  <p className="text-2xl font-bold text-green-500">Healthy</p>
                </div>
                <Database className="w-8 h-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tools */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Admin Tools & Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="system" className="w-full">
              <TabsList className="grid w-full grid-cols-6 bg-slate-700/50">
                <TabsTrigger value="system">System</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="ai">AI Models</TabsTrigger>
                <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="import">Data Import</TabsTrigger>
              </TabsList>

              {/* System Settings */}
              <TabsContent value="system" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-700">
                    <h3 className="font-semibold text-white mb-2">Application Settings</h3>
                    <div className="space-y-3 text-sm text-slate-300">
                      <div className="flex items-center justify-between">
                        <span>Maintenance Mode</span>
                        <Button size="sm" variant="outline">Disable</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>API Rate Limiting</span>
                        <Button size="sm" variant="outline">Configure</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Database Backup</span>
                        <Button size="sm" variant="outline">Backup Now</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Cache Management</span>
                        <Button size="sm" variant="outline">Clear Cache</Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-700">
                    <h3 className="font-semibold text-white mb-2">Security Settings</h3>
                    <div className="space-y-3 text-sm text-slate-300">
                      <div className="flex items-center justify-between">
                        <span>SSL Certificate</span>
                        <span className="text-green-500">✓ Valid</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Two-Factor Authentication</span>
                        <Button size="sm" variant="outline">Enable</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>IP Whitelist</span>
                        <Button size="sm" variant="outline">Manage</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* User Management */}
              <TabsContent value="users" className="space-y-4 mt-6">
                <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-700">
                  <h3 className="font-semibold text-white mb-4">User Management</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                      <div>
                        <p className="text-white font-medium">Mechanic Users</p>
                        <p className="text-sm text-slate-400">Field technicians</p>
                      </div>
                      <Button size="sm" variant="outline">Manage</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                      <div>
                        <p className="text-white font-medium">Admin Users</p>
                        <p className="text-sm text-slate-400">System administrators</p>
                      </div>
                      <Button size="sm" variant="outline">Manage</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                      <div>
                        <p className="text-white font-medium">Permissions</p>
                        <p className="text-sm text-slate-400">Role-based access control</p>
                      </div>
                      <Button size="sm" variant="outline">Configure</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* AI Models */}
              <TabsContent value="ai" className="space-y-4 mt-6">
                <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-700">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    AI Model Configuration
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                      <div>
                        <p className="text-white font-medium">Kimi API</p>
                        <p className="text-sm text-slate-400">Primary LLM provider</p>
                      </div>
                      <Button size="sm" variant="outline">Settings</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                      <div>
                        <p className="text-white font-medium">Model Parameters</p>
                        <p className="text-sm text-slate-400">Temperature, tokens, etc.</p>
                      </div>
                      <Button size="sm" variant="outline">Tune</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                      <div>
                        <p className="text-white font-medium">Prompt Templates</p>
                        <p className="text-sm text-slate-400">Diagnostic prompt optimization</p>
                      </div>
                      <Button size="sm" variant="outline">Edit</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Knowledge Base */}
              <TabsContent value="knowledge" className="space-y-4 mt-6">
                <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-700">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Knowledge Base Management
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                      <div>
                        <p className="text-white font-medium">Documents</p>
                        <p className="text-sm text-slate-400">Upload & manage knowledge docs</p>
                      </div>
                      <Button size="sm" variant="outline">Manage</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                      <div>
                        <p className="text-white font-medium">Error Codes</p>
                        <p className="text-sm text-slate-400">OBD-II code database</p>
                      </div>
                      <Button size="sm" variant="outline">Update</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                      <div>
                        <p className="text-white font-medium">Learning Engine</p>
                        <p className="text-sm text-slate-400">Feedback & pattern optimization</p>
                      </div>
                      <Button size="sm" variant="outline">Review</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Analytics */}
              <TabsContent value="analytics" className="space-y-4 mt-6">
                <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-700">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    System Analytics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                      <div>
                        <p className="text-white font-medium">Diagnostics Performed</p>
                        <p className="text-sm text-slate-400">Total & trending</p>
                      </div>
                      <Button size="sm" variant="outline">View</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                      <div>
                        <p className="text-white font-medium">AI Accuracy</p>
                        <p className="text-sm text-slate-400">Model performance metrics</p>
                      </div>
                      <Button size="sm" variant="outline">View</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                      <div>
                        <p className="text-white font-medium">System Performance</p>
                        <p className="text-sm text-slate-400">Response times & uptime</p>
                      </div>
                      <Button size="sm" variant="outline">View</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Data Import */}
              <TabsContent value="import" className="space-y-4 mt-6">
                <DataImportDashboard />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        {sessions && sessions.sessions.length > 0 && (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle>Active Collaboration Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sessions.sessions.map((session: any) => (
                  <div key={session.diagnosticId} className="flex items-center justify-between p-3 bg-slate-700/30 rounded">
                    <div>
                      <p className="text-white font-medium">{session.diagnosticId}</p>
                      <p className="text-sm text-slate-400">{session.userCount} users active</p>
                    </div>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      {Math.round(session.duration / 60)}m
                    </span>
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
