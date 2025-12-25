# Cron Job Tracking - Quick Reference

## Firestore Collections

### 1. `system_stats/cron_jobs` (Current Status)
**Purpose**: Latest execution status  
**Retention**: Permanent (overwrites)  
**Updates**: Every execution

```typescript
{
  calculateStorageStats: {
    lastRun: Timestamp,
    status: 'success' | 'failed',
    executionTimeMs: number,
    schedule: string,
    lastError: string | null
  },
  cleanupCronHistory: {
    lastRun: Timestamp,
    status: 'success' | 'failed',
    executionTimeMs: number,
    recordsDeleted: number,
    schedule: string,
    lastError: string | null
  }
}
```

### 2. `cron_history` (Detailed 24h)
**Purpose**: Every execution detail  
**Retention**: 24 hours (auto-deleted)  
**Query**: `orderBy('createdAt', 'desc').limit(50)`

```typescript
{
  id: string, // Auto-generated
  jobName: 'calculateStorageStats' | 'cleanupCronHistory',
  status: 'success' | 'failed',
  error: string | null,
  startTime: Timestamp,
  endTime: Timestamp,
  executionTimeMs: number,
  triggeredBy: 'auto' | 'manual',
  createdAt: Timestamp
}
```

### 3. `cron_stats_daily` (7-Day Aggregates)
**Purpose**: Daily performance metrics  
**Retention**: 7 days  
**Document ID**: `YYYY-MM-DD_jobName`

```typescript
{
  date: '2025-01-20',
  jobName: 'calculateStorageStats',
  totalRuns: number,
  successes: number,
  failures: number,
  avgExecutionTimeMs: number,
  minExecutionTimeMs: number,
  maxExecutionTimeMs: number,
  failureDetails: [{
    time: '2025-01-20T10:30:00Z',
    error: 'Connection timeout',
    executionTimeMs: 5000,
    triggeredBy: 'auto'
  }],
  lastRunTime: Timestamp
}
```

## Cloud Functions

### calculateStorageStats
- **Schedule**: `every 1 hours`
- **Timezone**: `Asia/Ho_Chi_Minh`
- **Timeout**: 120s
- **Memory**: 512MiB
- **Tracking**: ✅ Full hybrid tracking

### updateStorageStats
- **Trigger**: HTTP (Manual)
- **CORS**: Enabled
- **Auth**: Required (SysAdmin only)
- **Tracking**: ✅ Full hybrid tracking (marked as `triggeredBy: 'manual'`)

### cleanupCronHistory
- **Schedule**: `every 6 hours`
- **Timezone**: `Asia/Ho_Chi_Minh`
- **Timeout**: 60s
- **Memory**: 256MiB
- **Action**: Delete records older than 24h
- **Batch Size**: 500 records
- **Tracking**: ✅ Self-tracked with `recordsDeleted` count

## API Functions

### getCronJobsStatus()
```typescript
// Get current status for all jobs
const status = await getCronJobsStatus();
// Returns: CronJobsData | null
```

### getRecentCronHistory(jobName?: string)
```typescript
// Get last 50 executions (or filtered by job)
const history = await getRecentCronHistory('calculateStorageStats');
// Returns: CronHistoryRecord[]
```

### getDailyStats(jobName?: string)
```typescript
// Get 7-day summary
const stats = await getDailyStats();
// Returns: DailyStats[]
```

### subscribeToCronHistory(callback, jobName?)
```typescript
// Real-time listener for cron history
const unsubscribe = subscribeToCronHistory((history) => {
  console.log('Updated:', history);
});
// Call unsubscribe() to stop listening
```

## Admin Dashboard UI Sections

### 1. Current Status
- Job name, schedule, status badge
- Last run, next run, execution time
- Error details (if failed)
- Special metrics (e.g., records deleted)

### 2. Recent Activity (24h)
- Scrollable table (max 50 records)
- Columns: Time, Job, Status, Duration, Trigger
- Real-time updates
- Manual vs Auto indicators

### 3. 7-Day Summary
- Daily stats cards
- Success rate percentage
- Avg/Min/Max execution times
- Recent error details (up to 3 per day)

## Translation Keys

All under `settings.admin.cronJobs`:

- `title` - "Scheduled Jobs Status"
- `currentStatus` - "Current Status"
- `recentActivity` - "Recent Activity (Last 24h)"
- `weekSummary` - "7-Day Summary"
- `time`, `job`, `status`, `duration`, `trigger`
- `runs`, `success`, `failures`, `avgTime`
- `recordsDeleted`, `recentErrors`

## Firestore Indexes

```json
{
  "collectionGroup": "cron_history",
  "fields": [
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "cron_history",
  "fields": [
    { "fieldPath": "jobName", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

## Common Queries

### Get today's stats
```typescript
const today = new Date().toISOString().split('T')[0];
const docRef = doc(db, 'cron_stats_daily', `${today}_calculateStorageStats`);
const snapshot = await getDoc(docRef);
```

### Get failed executions in last 24h
```typescript
const q = query(
  collection(db, 'cron_history'),
  where('status', '==', 'failed'),
  orderBy('createdAt', 'desc'),
  limit(20)
);
```

### Get specific job history
```typescript
const q = query(
  collection(db, 'cron_history'),
  where('jobName', '==', 'calculateStorageStats'),
  orderBy('createdAt', 'desc'),
  limit(50)
);
```

## Deployment Commands

```bash
# Build functions
cd functions
npm run build

# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:cleanupCronHistory

# Deploy indexes
firebase deploy --only firestore:indexes
```

## Monitoring Tips

1. **Check Current Status**: Admin Dashboard → Cron Jobs tab → Top section
2. **Debug Issues**: Look at Recent Activity table for error details
3. **Track Trends**: Review 7-Day Summary for patterns
4. **Manual Testing**: Use "Calculate Stats" button in Usage tab
5. **Verify Cleanup**: Check Firestore console for record count in `cron_history`

## Troubleshooting

**Q: No data showing in Recent Activity?**
- Wait for next scheduled run (every 1 hour)
- Or trigger manually via "Calculate Stats" button

**Q: Daily stats not updating?**
- Check if job is executing (see Current Status)
- Verify Firestore indexes are deployed
- Check browser console for errors

**Q: Old records not deleting?**
- Verify `cleanupCronHistory` function is deployed
- Check function logs in Firebase Console
- Confirm it's scheduled to run every 6 hours

**Q: Real-time updates not working?**
- Check browser console for Firestore permission errors
- Verify user has SysAdmin role
- Refresh page to reconnect listeners
