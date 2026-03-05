/**
 * Import Notifications Webhook System
 * Sends notifications to admins when imports complete or fail
 */

import { notifyOwner } from '../_core/notification';
import { getDb } from '../db';
import { dataImportStatus } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

interface ImportNotificationPayload {
  importId: number;
  status: 'completed' | 'failed';
  totalRecords?: number;
  processedRecords?: number;
  failedRecords?: number;
  durationSeconds?: number;
  errorMessage?: string;
}

/**
 * Send import completion notification
 */
export async function notifyImportCompletion(payload: ImportNotificationPayload) {
  const db = await getDb();
  if (!db) return false;

  // Get import details
  const importData = await db
    .select()
    .from(dataImportStatus)
    .where(eq(dataImportStatus.id, payload.importId))
    .limit(1);

  if (!importData.length) {
    return false;
  }

  const imp = importData[0];
  const successRate = imp.total_records
    ? ((((imp.total_records - (imp.failed_records || 0)) / imp.total_records) * 100).toFixed(1))
    : '0';

  let title = '';
  let content = '';

  if (payload.status === 'completed') {
    title = `✅ Vehicle Import Completed`;
    content = `
**Import Summary:**
- Type: ${imp.import_type}
- Total Records: ${imp.total_records?.toLocaleString() || 'N/A'}
- Processed: ${imp.processed_records?.toLocaleString() || 'N/A'}
- Failed: ${imp.failed_records || 0}
- Success Rate: ${successRate}%
- Duration: ${imp.duration_seconds ? `${Math.floor(imp.duration_seconds / 60)}m ${imp.duration_seconds % 60}s` : 'N/A'}
- Completed: ${imp.completed_at?.toLocaleString() || 'N/A'}

The vehicle data import has been successfully completed and is now available in the system.
    `.trim();
  } else {
    title = `❌ Vehicle Import Failed`;
    content = `
**Import Error:**
- Type: ${imp.import_type}
- Status: ${imp.status}
- Error: ${imp.error_message || 'Unknown error'}
- Total Records: ${imp.total_records?.toLocaleString() || 'N/A'}
- Processed: ${imp.processed_records?.toLocaleString() || 'N/A'}
- Failed: ${imp.failed_records || 0}
- Started: ${imp.started_at?.toLocaleString() || 'N/A'}

Please check the import history in the admin dashboard for more details and retry options.
    `.trim();
  }

  // Send notification to owner
  try {
    const result = await notifyOwner({ title, content });
    return result;
  } catch (error) {
    console.error('Failed to send import notification:', error);
    return false;
  }
}

/**
 * Send import progress notification (for long-running imports)
 */
export async function notifyImportProgress(payload: {
  importId: number;
  progress: number; // 0-100
  processedRecords: number;
  totalRecords: number;
  estimatedTimeRemaining: number; // seconds
}) {
  const db = await getDb();
  if (!db) return false;

  const importData = await db
    .select()
    .from(dataImportStatus)
    .where(eq(dataImportStatus.id, payload.importId))
    .limit(1);

  if (!importData.length) {
    return false;
  }

  const imp = importData[0];
  const title = `📊 Vehicle Import Progress: ${payload.progress}%`;
  const eta = Math.floor(payload.estimatedTimeRemaining / 60);

  const content = `
**Import Progress:**
- Type: ${imp.import_type}
- Progress: ${payload.progress}%
- Processed: ${payload.processedRecords.toLocaleString()} / ${payload.totalRecords.toLocaleString()}
- Estimated Time Remaining: ${eta}m

The import is progressing normally. You will receive a notification when it completes.
  `.trim();

  try {
    const result = await notifyOwner({ title, content });
    return result;
  } catch (error) {
    console.error('Failed to send progress notification:', error);
    return false;
  }
}

/**
 * Send import error notification with retry option
 */
export async function notifyImportError(payload: {
  importId: number;
  errorMessage: string;
  failedRecords: number;
  totalRecords: number;
  retryable: boolean;
}) {
  const db = await getDb();
  if (!db) return false;

  const title = `⚠️ Import Error - Action Required`;
  const failureRate = ((payload.failedRecords / payload.totalRecords) * 100).toFixed(1);

  const content = `
**Import Error Details:**
- Error: ${payload.errorMessage}
- Failed Records: ${payload.failedRecords} / ${payload.totalRecords} (${failureRate}%)
- Retryable: ${payload.retryable ? 'Yes' : 'No'}

${payload.retryable ? 'You can retry this import from the admin dashboard.' : 'This import cannot be automatically retried. Please review the error and adjust your data.'}
  `.trim();

  try {
    const result = await notifyOwner({ title, content });
    return result;
  } catch (error) {
    console.error('Failed to send error notification:', error);
    return false;
  }
}

/**
 * Webhook handler for import status updates
 */
export async function handleImportWebhook(event: {
  type: 'import.started' | 'import.progress' | 'import.completed' | 'import.failed';
  payload: any;
}) {
  switch (event.type) {
    case 'import.completed':
      return notifyImportCompletion({
        importId: event.payload.importId,
        status: 'completed',
        totalRecords: event.payload.totalRecords,
        processedRecords: event.payload.processedRecords,
        failedRecords: event.payload.failedRecords,
        durationSeconds: event.payload.durationSeconds,
      });

    case 'import.failed':
      return notifyImportError({
        importId: event.payload.importId,
        errorMessage: event.payload.errorMessage,
        failedRecords: event.payload.failedRecords,
        totalRecords: event.payload.totalRecords,
        retryable: event.payload.retryable,
      });

    case 'import.progress':
      // Only notify on significant progress (every 25%)
      if (event.payload.progress % 25 === 0) {
        return notifyImportProgress({
          importId: event.payload.importId,
          progress: event.payload.progress,
          processedRecords: event.payload.processedRecords,
          totalRecords: event.payload.totalRecords,
          estimatedTimeRemaining: event.payload.estimatedTimeRemaining,
        });
      }
      return true;

    default:
      return false;
  }
}
