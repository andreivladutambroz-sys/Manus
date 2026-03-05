/**
 * Data Import Dashboard - Monitor vehicle data import progress
 * Shows batch processing, success rate, and real-time statistics
 */

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';

interface ImportStats {
  totalBatches: number;
  completedBatches: number;
  totalInserted: number;
  failedBatches: number;
  successRate: number;
  elapsedTime: number;
  estimatedTimeRemaining: number;
  throughput: number; // batches per second
}

export function DataImportDashboard() {
  const [isImporting, setIsImporting] = useState(false);
  const [stats, setStats] = useState<ImportStats>({
    totalBatches: 6000,
    completedBatches: 0,
    totalInserted: 0,
    failedBatches: 0,
    successRate: 0,
    elapsedTime: 0,
    estimatedTimeRemaining: 0,
    throughput: 0,
  });
  const [batchSize, setBatchSize] = useState(50);
  const [totalVehicles, setTotalVehicles] = useState(300000);
  const [concurrentAgents, setConcurrentAgents] = useState(6);
  const [importLogs, setImportLogs] = useState<string[]>([]);

  const progress = (stats.completedBatches / stats.totalBatches) * 100;

  const startImport = async () => {
    setIsImporting(true);
    setImportLogs([]);
    addLog('🚀 Starting vehicle data import...');
    addLog(`Target: ${totalVehicles.toLocaleString()} vehicles`);
    addLog(`Batch Size: ${batchSize}`);
    addLog(`Concurrent Agents: ${concurrentAgents}`);

    try {
      // Simulate import progress
      let completed = 0;
      const totalBatches = Math.ceil(totalVehicles / batchSize);
      const startTime = Date.now();

      while (completed < totalBatches) {
        // Simulate batch processing
        await new Promise(resolve => setTimeout(resolve, 500));
        
        completed += concurrentAgents;
        if (completed > totalBatches) completed = totalBatches;

        const elapsedSec = (Date.now() - startTime) / 1000;
        const throughput = completed / elapsedSec;
        const remaining = totalBatches - completed;
        const etaSec = remaining / throughput;

        setStats({
          totalBatches,
          completedBatches: completed,
          totalInserted: completed * batchSize,
          failedBatches: Math.floor(completed * 0.01), // Assume 1% failure
          successRate: 99,
          elapsedTime: elapsedSec,
          estimatedTimeRemaining: etaSec,
          throughput,
        });

        if (completed % 100 === 0) {
          addLog(`✅ Processed ${completed}/${totalBatches} batches (${((completed / totalBatches) * 100).toFixed(1)}%)`);
        }
      }

      addLog('✅ Import completed successfully!');
      setIsImporting(false);
    } catch (error) {
      addLog(`❌ Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsImporting(false);
    }
  };

  const addLog = (message: string) => {
    setImportLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <Card className="p-6 bg-slate-50 dark:bg-slate-900">
        <h3 className="text-lg font-semibold mb-4">Import Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Total Vehicles</label>
            <input
              type="number"
              value={totalVehicles}
              onChange={(e) => setTotalVehicles(parseInt(e.target.value))}
              disabled={isImporting}
              className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Batch Size</label>
            <input
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value))}
              disabled={isImporting}
              className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Concurrent Agents</label>
            <input
              type="number"
              value={concurrentAgents}
              onChange={(e) => setConcurrentAgents(parseInt(e.target.value))}
              disabled={isImporting}
              className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
        </div>

        <Button
          onClick={startImport}
          disabled={isImporting}
          className="w-full"
          size="lg"
        >
          {isImporting ? 'Importing...' : 'Start Import'}
        </Button>
      </Card>

      {/* Progress Panel */}
      {(isImporting || stats.completedBatches > 0) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Import Progress</h3>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-semibold">{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed Batches</div>
              <div className="text-2xl font-bold">{stats.completedBatches.toLocaleString()}</div>
              <div className="text-xs text-gray-500">of {stats.totalBatches.toLocaleString()}</div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Inserted</div>
              <div className="text-2xl font-bold">{stats.totalInserted.toLocaleString()}</div>
              <div className="text-xs text-gray-500">vehicles</div>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <div className="text-xs text-gray-500">{stats.failedBatches} failed</div>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Throughput</div>
              <div className="text-2xl font-bold">{stats.throughput.toFixed(2)}</div>
              <div className="text-xs text-gray-500">batches/sec</div>
            </div>
          </div>

          {/* Time Information */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Elapsed</div>
                <div className="font-semibold">{formatTime(stats.elapsedTime)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">ETA</div>
                <div className="font-semibold">{formatTime(stats.estimatedTimeRemaining)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {stats.failedBatches === 0 ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Status</div>
                <div className="font-semibold">
                  {isImporting ? 'In Progress' : 'Completed'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Logs Panel */}
      {importLogs.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Import Logs</h3>
          <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
            {importLogs.map((log, i) => (
              <div key={i} className="whitespace-pre-wrap break-words">
                {log}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
