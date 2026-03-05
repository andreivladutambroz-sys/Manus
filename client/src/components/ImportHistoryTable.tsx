/**
 * Import History Table Component
 * Displays all vehicle data imports with statistics and actions
 */

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Trash2, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ImportHistoryTableProps {
  onRefresh?: () => void;
}

export function ImportHistoryTable({ onRefresh }: ImportHistoryTableProps) {
  const [selectedImport, setSelectedImport] = useState<number | null>(null);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  const { data: history, isLoading, refetch } = trpc.importHistory.getHistory.useQuery({
    limit,
    offset,
  });

  const { data: stats } = trpc.importHistory.getStats.useQuery();

  const retryMutation = trpc.importHistory.retryImport.useMutation({
    onSuccess: () => {
      refetch();
      onRefresh?.();
    },
  });

  const deleteMutation = trpc.importHistory.deleteImport.useMutation({
    onSuccess: () => {
      refetch();
      onRefresh?.();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm font-medium text-gray-600">Total Imports</div>
            <div className="text-2xl font-bold mt-2">{stats.totalImports}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium text-gray-600">Success Rate</div>
            <div className="text-2xl font-bold mt-2 text-green-600">{stats.successRate}%</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium text-gray-600">Total Vehicles</div>
            <div className="text-2xl font-bold mt-2">{stats.totalVehicles.toLocaleString()}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-medium text-gray-600">Total Time</div>
            <div className="text-2xl font-bold mt-2">{stats.totalTimeMinutes}m</div>
          </Card>
        </div>
      )}

      {/* History Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Import Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Processed</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="inline-block animate-spin" />
                  </TableCell>
                </TableRow>
              ) : history && history.length > 0 ? (
                history.map((imp) => (
                  <TableRow key={imp.id}>
                    <TableCell className="font-medium">{imp.import_type}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(imp.status)}>
                        {imp.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{imp.total_records?.toLocaleString() || '-'}</TableCell>
                    <TableCell>{imp.processed_records?.toLocaleString() || '-'}</TableCell>
                    <TableCell>
                      {imp.failed_records ? (
                        <span className="text-red-600 font-medium">
                          {imp.failed_records}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{formatDuration(imp.duration_seconds)}</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(imp.started_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedImport(imp.id)}
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {imp.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryMutation.mutate({ importId: imp.id })}
                            disabled={retryMutation.isPending}
                            title="Retry import"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMutation.mutate({ importId: imp.id })}
                          disabled={deleteMutation.isPending}
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No import history found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center p-4 border-t">
          <Button
            variant="outline"
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Showing {offset + 1} to {offset + limit}
          </span>
          <Button
            variant="outline"
            onClick={() => setOffset(offset + limit)}
            disabled={!history || history.length < limit}
          >
            Next
          </Button>
        </div>
      </Card>
    </div>
  );
}
