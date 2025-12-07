# Testing Guide for New Enhancement Features

## 🧪 Testing Roadmap

### Quick Test Checklist
- [ ] Enhanced Search Filter - Basic & Advanced filters
- [ ] Share Memory - Download & Web Share
- [ ] Memory Statistics - Metrics calculation
- [ ] Error Boundary - Error catching & retry
- [ ] Retry Logic - API failure handling

---

## 1. 🔍 Enhanced Search Filter Testing

### Setup for Testing
Add to `ViewMemory.tsx`:

```tsx
import { EnhancedSearchFilter } from './components/EnhancedSearchFilter';

// Add state
const [searchQuery, setSearchQuery] = useState('');
const [selectedYear, setSelectedYear] = useState('ALL');
const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);

// Get available years from memories
const availableYears = useMemo(() => {
  const years = new Set(memories.map(m => m.date.substring(0, 4)));
  return Array.from(years).sort().reverse();
}, [memories]);

// Filter memories based on search
useEffect(() => {
  let filtered = memories;
  
  // Search query filter
  if (searchQuery) {
    filtered = filtered.filter(m => 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // Year filter
  if (selectedYear !== 'ALL') {
    filtered = filtered.filter(m => m.date.startsWith(selectedYear));
  }
  
  setFilteredMemories(filtered);
}, [memories, searchQuery, selectedYear]);

// Render component (place before memory cards)
<EnhancedSearchFilter
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  selectedYear={selectedYear}
  onYearChange={setSelectedYear}
  availableYears={availableYears}
  resultCount={filteredMemories.length}
/>

{/* Use filteredMemories instead of memories */}
{filteredMemories.map((memory) => (
  // ... memory card
))}
```

### Test Cases

#### ✅ Test 1: Basic Search
1. **Action**: Type "birthday" in search box
2. **Expected**: Only memories with "birthday" in title/text/location show
3. **Check**: Result count updates correctly
4. **Check**: Highlight info shows "(đang tô sáng: "birthday")"

#### ✅ Test 2: Year Filter
1. **Action**: Select "2024" from year dropdown
2. **Expected**: Only 2024 memories display
3. **Check**: Result count shows correct number

#### ✅ Test 3: Combined Filters
1. **Action**: Search "love" + Select year "2023"
2. **Expected**: Only 2023 memories containing "love"
3. **Check**: Both filters work together

#### ✅ Test 4: Clear Search
1. **Action**: Type search text, then click X button
2. **Expected**: Search clears, all memories show
3. **Check**: Input field is empty

#### ✅ Test 5: Advanced Filters Toggle
1. **Action**: Click "Nâng cao" button
2. **Expected**: Advanced filters section slides down
3. **Check**: Button shows "active" state
4. **Action**: Click again
5. **Expected**: Section collapses

#### ✅ Test 6: Clear All Filters
1. **Action**: Apply multiple filters, click "Xóa lọc"
2. **Expected**: All filters reset, all memories show
3. **Check**: Search input empty, year = "ALL"

#### ✅ Test 7: No Results
1. **Action**: Search for "nonexistenttext123"
2. **Expected**: "Tìm thấy 0 kỷ niệm" shows
3. **Check**: No errors in console

#### ✅ Test 8: Mobile Responsive
1. **Action**: Resize browser to mobile width (<768px)
2. **Expected**: Filters stack vertically
3. **Check**: All controls remain usable

---

## 2. 📤 Share Memory Testing

### Setup for Testing
Add to memory card actions in `ViewMemory.tsx`:

```tsx
import { ShareMemory } from './components/ShareMemory';

// Add state
const [shareModalOpen, setShareModalOpen] = useState(false);
const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

// Add share button in memory card
<button 
  onClick={() => {
    setSelectedMemory(memory);
    setShareModalOpen(true);
  }}
  className="share-button"
>
  <Share2 size={20} />
  Chia sẻ
</button>

// Add modal
{shareModalOpen && selectedMemory && (
  <ShareMemory
    memory={selectedMemory}
    onClose={() => {
      setShareModalOpen(false);
      setSelectedMemory(null);
    }}
    theme={{
      colors: {
        primary: '#ec4899',
        secondary: '#be185d',
        background: '#fef3f9'
      }
    }}
  />
)}
```

### Test Cases

#### ✅ Test 1: Open Share Modal
1. **Action**: Click "Chia sẻ" button on a memory
2. **Expected**: Modal opens with memory preview
3. **Check**: Preview shows title, date, location, images, text

#### ✅ Test 2: Download Memory as PNG
1. **Action**: Click "Tải Xuống" button
2. **Expected**: 
   - Button shows "Đang xử lý..." with spinner
   - PNG file downloads to Downloads folder
   - Filename: `memory-{title}-{timestamp}.png`
3. **Check**: Open downloaded image, verify quality
4. **Check**: Modal closes after 1 second

#### ✅ Test 3: Web Share API (Mobile)
**Test on mobile browser (Chrome/Safari):**
1. **Action**: Click "Chia Sẻ" button
2. **Expected**: Native share sheet opens
3. **Options**: WhatsApp, Messenger, Instagram, etc.
4. **Check**: Can share to any app successfully

**Test on desktop (no Web Share):**
1. **Action**: Click "Chia Sẻ" button
2. **Expected**: Falls back to download automatically
3. **Check**: PNG downloads instead

#### ✅ Test 4: Memory with Multiple Images
1. **Action**: Share memory with 4+ images
2. **Expected**: Preview shows first 4 images
3. **Check**: "+{count}" overlay on 4th image if more exist

#### ✅ Test 5: Memory with Single Image
1. **Action**: Share memory with 1 image
2. **Expected**: Single image takes full width
3. **Check**: No grid layout, full-width display

#### ✅ Test 6: Memory with No Images
1. **Action**: Share memory without images
2. **Expected**: Preview shows title, date, text only
3. **Check**: No image section appears

#### ✅ Test 7: Long Text Truncation
1. **Action**: Share memory with 300+ character text
2. **Expected**: Text truncates at 200 chars with "..."
3. **Check**: Preview remains clean and readable

#### ✅ Test 8: Close Modal
1. **Action**: Click X button or click outside modal
2. **Expected**: Modal closes, state resets
3. **Check**: No memory leaks, clean closure

#### ✅ Test 9: CORS Image Loading
1. **Action**: Share memory with Cloudinary images
2. **Expected**: Images load correctly in canvas
3. **Check**: No CORS errors in console
4. **Note**: If CORS errors occur, images won't render in PNG

#### ✅ Test 10: Error Handling
1. **Action**: Disconnect internet, try to share
2. **Expected**: Error message shows
3. **Check**: "Đã xảy ra lỗi khi tạo ảnh" displays

---

## 3. 📊 Memory Statistics Testing

### Setup for Testing
Add to `ViewMemory.tsx` or create dedicated page:

```tsx
import { MemoryStatistics } from './components/MemoryStatistics';

// Add toggle button
const [showStats, setShowStats] = useState(false);

<button 
  onClick={() => setShowStats(!showStats)}
  className="stats-toggle-btn"
>
  <BarChart3 size={20} />
  {showStats ? 'Ẩn Thống Kê' : 'Xem Thống Kê'}
</button>

{showStats && (
  <MemoryStatistics
    memories={memories}
    theme={{
      colors: {
        primary: '#ec4899',
        secondary: '#be185d'
      }
    }}
  />
)}
```

### Test Cases

#### ✅ Test 1: Display Stats with Data
1. **Precondition**: Have at least 10 memories
2. **Action**: Click "Xem Thống Kê"
3. **Expected**: Dashboard shows with 4 metric cards:
   - Total Memories count
   - Total Images count
   - Recent 3 months count
   - Most Active Month
4. **Check**: All numbers are accurate

#### ✅ Test 2: Total Memories Calculation
1. **Manual Count**: Count memories in database
2. **Dashboard**: Check "Tổng Kỷ Niệm" value
3. **Expected**: Numbers match exactly

#### ✅ Test 3: Total Images Calculation
1. **Manual Count**: Sum all image counts from memories
2. **Dashboard**: Check "Tổng Hình Ảnh" value
3. **Expected**: Numbers match
4. **Check**: "~X ảnh/kỷ niệm" shows correct average

#### ✅ Test 4: Recent Activity (3 Months)
1. **Manual Filter**: Count memories from last 3 months
2. **Dashboard**: Check "3 Tháng Gần Đây" value
3. **Expected**: Only includes memories ≥ 3 months ago

#### ✅ Test 5: Most Active Month
1. **Manual Check**: Find month with most memories
2. **Dashboard**: Check "Tháng Nhiều Nhất" card
3. **Expected**: Shows correct month and count
4. **Format**: "Jan 2024" style

#### ✅ Test 6: Memories by Year Chart
1. **Check**: Bar chart shows all years
2. **Expected**: Sorted descending (newest first)
3. **Expected**: Bar widths proportional to count
4. **Animation**: Bars animate from 0 to full width
5. **Check**: Each bar shows year and count

#### ✅ Test 7: Top Locations List
1. **Check**: Shows top 5 locations
2. **Expected**: Sorted by count (descending)
3. **Expected**: Each shows:
   - Rank badge (1-5)
   - Location name
   - Memory count
4. **Hover**: Item highlights and slides right

#### ✅ Test 8: Empty State
1. **Precondition**: No memories
2. **Action**: Open statistics
3. **Expected**: Shows empty state with heart icon
4. **Message**: "Chưa có thống kê. Hãy tạo kỷ niệm đầu tiên!"

#### ✅ Test 9: Theme Integration
1. **Action**: Change theme in Profile
2. **Expected**: Statistics colors update:
   - Primary color for icons, values, charts
   - Hover effects match theme
3. **Check**: No hardcoded colors remain

#### ✅ Test 10: Mobile Responsive
1. **Action**: View on mobile (<768px)
2. **Expected**: 
   - Stat cards stack vertically (1 column)
   - Charts remain readable
   - Padding adjusts for small screen
3. **Check**: No horizontal scroll

---

## 4. 🛡️ Error Boundary Testing

### Setup for Testing

#### Option A: Wrap Entire App
In `App.tsx`:
```tsx
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* all routes */}
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

#### Option B: Wrap Individual Routes
```tsx
import { withErrorBoundary } from './components/ErrorBoundary';

const ViewMemoryWithError = withErrorBoundary(ViewMemory);
const CreateMemoryWithError = withErrorBoundary(CreateMemory);

<Routes>
  <Route path="/view" element={<ViewMemoryWithError />} />
  <Route path="/create" element={<CreateMemoryWithError />} />
</Routes>
```

### Test Cases

#### ✅ Test 1: Catch React Render Error
**Create intentional error:**
```tsx
// In ViewMemory.tsx (temporarily for testing)
const TestError = () => {
  throw new Error('Test error for Error Boundary');
  return <div>Never renders</div>;
};

// Add to component
{testErrorBoundary && <TestError />}
```

1. **Action**: Enable test error
2. **Expected**: Error Boundary catches error
3. **UI Shows**:
   - Red warning icon (pulsing)
   - "Oops! Đã có lỗi xảy ra"
   - Error description
   - "Thử Lại" button (primary)
   - "Về Trang Chủ" button (secondary)
4. **Check**: Console shows error log

#### ✅ Test 2: Retry Button
1. **Precondition**: Error Boundary is showing
2. **Action**: Click "Thử Lại" button
3. **Expected**: 
   - Error state resets
   - Component re-renders
   - If error fixed, shows normal UI
   - If error persists, shows Error Boundary again

#### ✅ Test 3: Go Home Button
1. **Precondition**: Error Boundary is showing
2. **Action**: Click "Về Trang Chủ" button
3. **Expected**: Redirects to home page (/)

#### ✅ Test 4: Repeated Errors
1. **Action**: Trigger error, retry, trigger again, retry (3+ times)
2. **Expected**: After 3rd error, warning shows:
   - "Lỗi đang lặp lại. Vui lòng làm mới trang hoặc liên hệ hỗ trợ."
3. **Check**: Yellow warning banner appears

#### ✅ Test 5: Development vs Production Mode
**Development (npm run dev):**
1. **Action**: Trigger error
2. **Expected**: Shows collapsible error details
3. **Check**: Can expand "Chi tiết lỗi (Development Only)"
4. **Check**: Shows error message and component stack

**Production (npm run build):**
1. **Action**: Trigger error
2. **Expected**: Error details section NOT shown
3. **Security**: No stack traces exposed

#### ✅ Test 6: Custom Fallback
```tsx
<ErrorBoundary
  fallback={(error, reset) => (
    <div className="custom-error">
      <h2>Custom Error UI</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try Again</button>
    </div>
  )}
>
  <SomeComponent />
</ErrorBoundary>
```

1. **Action**: Trigger error
2. **Expected**: Custom fallback renders instead of default
3. **Check**: Custom UI shows

#### ✅ Test 7: Multiple Error Boundaries
```tsx
<ErrorBoundary> {/* Top level */}
  <Header />
  <ErrorBoundary> {/* Feature level */}
    <MemoryList />
  </ErrorBoundary>
  <Footer />
</ErrorBoundary>
```

1. **Action**: Error in MemoryList
2. **Expected**: Inner boundary catches it
3. **Check**: Header and Footer still work

#### ✅ Test 8: Error Not Caught
**These are NOT caught by Error Boundary:**
- Event handlers errors
- Async code (setTimeout, Promise)
- Server-side rendering errors

```tsx
// This will NOT be caught
<button onClick={() => {
  throw new Error('Not caught');
}}>
  Click
</button>
```

1. **Action**: Click button
2. **Expected**: Error goes to console, no Error Boundary
3. **Solution**: Use try-catch in event handler

---

## 5. 🔁 Retry Logic Testing

### Setup for Testing

#### Option A: Wrap API Functions
```tsx
import { withRetry } from '../utils/retry';
import { getMemories } from '../apis/memoriesApi';

// Wrap function
const getMemoriesWithRetry = withRetry(getMemories, {
  maxRetries: 3,
  initialDelay: 1000,
  onRetry: (error, attempt, delay) => {
    console.log(`Retry attempt ${attempt}, waiting ${delay}ms`);
    // Show toast notification
  }
});

// Use in component
const memories = await getMemoriesWithRetry(userId);
```

#### Option B: Use React Hook
```tsx
import { useRetryableRequest } from '../utils/retry';

function MyComponent() {
  const { data, loading, error, retryCount, retry } = useRetryableRequest(
    () => api.getMemories(userId),
    {
      maxRetries: 3,
      onRetry: (err, attempt, delay) => {
        console.log(`Retrying... (${attempt}/3)`);
      }
    }
  );

  if (loading) return <div>Loading... {retryCount > 0 && `Retry ${retryCount}`}</div>;
  if (error) return <button onClick={retry}>Retry</button>;
  
  return <div>{/* render data */}</div>;
}
```

### Test Cases

#### ✅ Test 1: Network Error Retry
**Simulate network error:**
1. **Setup**: Open DevTools → Network → Go offline
2. **Action**: Try to fetch memories
3. **Expected**: 
   - Request fails
   - Retry #1 after 1s delay
   - Retry #2 after 2s delay (exponential backoff)
   - Retry #3 after 4s delay
4. **Console**: Shows retry logs
5. **Action**: Go online before retries exhaust
6. **Expected**: Next retry succeeds

#### ✅ Test 2: 500 Server Error Retry
**Simulate with mock:**
```tsx
// Temporarily mock API
let attemptCount = 0;
const mockAPI = async () => {
  attemptCount++;
  if (attemptCount < 3) {
    throw { response: { status: 500 }, message: '500 Server Error' };
  }
  return realData;
};
```

1. **Action**: Call API
2. **Expected**: 
   - First 2 calls fail with 500
   - Third call succeeds
3. **Check**: Total 3 attempts made

#### ✅ Test 3: 404 Error No Retry
**404 should NOT retry:**
```tsx
const mockAPI = async () => {
  throw { response: { status: 404 }, message: 'Not Found' };
};
```

1. **Action**: Call API
2. **Expected**: 
   - Fails immediately
   - No retries (404 is client error)
3. **Check**: Only 1 attempt made

#### ✅ Test 4: Max Retries Exhausted
1. **Setup**: Keep network offline
2. **Action**: Call API
3. **Expected**: 
   - Retries 3 times
   - After 3rd retry, throws final error
4. **UI**: Shows error state
5. **Check**: Total 4 attempts (initial + 3 retries)

#### ✅ Test 5: Exponential Backoff Timing
1. **Action**: Trigger retry
2. **Measure delays**:
   - Attempt 1: 1000ms (1s)
   - Attempt 2: 2000ms (2s)
   - Attempt 3: 4000ms (4s)
3. **Formula**: `delay = initialDelay * (2 ^ attempt)`
4. **Check**: Timing matches

#### ✅ Test 6: Max Delay Cap
```tsx
withRetry(fn, {
  initialDelay: 1000,
  maxDelay: 5000,
  maxRetries: 10
});
```

1. **Action**: Trigger retries
2. **Expected**: Delay never exceeds 5000ms
3. **Check**: Even on attempt 10, delay = 5000ms (capped)

#### ✅ Test 7: Custom Retry Condition
```tsx
withRetry(fn, {
  shouldRetry: (error, attempt) => {
    // Only retry specific errors
    return error.code === 'NETWORK_ERROR' && attempt < 5;
  }
});
```

1. **Action**: Trigger different error types
2. **Expected**: Only retries on NETWORK_ERROR
3. **Check**: Other errors fail immediately

#### ✅ Test 8: onRetry Callback
```tsx
const retryLog: string[] = [];

withRetry(fn, {
  onRetry: (error, attempt, delay) => {
    retryLog.push(`Attempt ${attempt}: ${delay}ms`);
  }
});
```

1. **Action**: Trigger retries
2. **Expected**: Callback fires on each retry
3. **Check**: `retryLog` has 3 entries

#### ✅ Test 9: React Hook Loading State
```tsx
const { loading, retryCount } = useRetryableRequest(fetchData);
```

1. **Action**: Call API with retries
2. **Expected**: 
   - `loading = true` during all attempts
   - `retryCount` increments: 0 → 1 → 2 → 3
3. **UI**: Show "Loading... (Retry 2/3)"

#### ✅ Test 10: Manual Retry Button
```tsx
const { error, retry } = useRetryableRequest(fetchData);

if (error) {
  return <button onClick={retry}>Thử Lại</button>;
}
```

1. **Action**: Let API fail completely
2. **Expected**: Error state shows
3. **Action**: Click "Thử Lại" button
4. **Expected**: Starts new retry cycle

---

## 🎯 Integration Testing Workflow

### Step 1: Test Components Individually
1. Test EnhancedSearchFilter alone
2. Test ShareMemory alone
3. Test MemoryStatistics alone
4. Test ErrorBoundary alone
5. Test Retry Logic alone

### Step 2: Test Component Interactions
1. Search + Statistics (filtered stats)
2. Search + Share (share filtered memory)
3. Error Boundary + Retry (handle API failures gracefully)

### Step 3: Performance Testing
1. **Large Dataset**: Test with 500+ memories
2. **Slow Network**: Throttle to 3G speed
3. **Memory Leaks**: Open/close modals 50 times
4. **Mobile Performance**: Test on real device

### Step 4: Cross-Browser Testing
- Chrome (Desktop & Mobile)
- Firefox
- Safari (Desktop & iOS)
- Edge

### Step 5: Accessibility Testing
1. Keyboard navigation (Tab, Enter, Esc)
2. Screen reader compatibility
3. Color contrast (WCAG AA)
4. Focus indicators

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Error in ShareMemory
**Symptom**: Images don't render in exported PNG
**Solution**: 
```tsx
// In html2canvas options
useCORS: true

// In Cloudinary config, ensure CORS headers
Access-Control-Allow-Origin: *
```

### Issue 2: Retry Logic Not Working
**Symptom**: No retries happening
**Solution**: Check error format matches `shouldRetry` condition
```tsx
// Error must have .response.status or .status
console.log(error); // Debug error structure
```

### Issue 3: Error Boundary Not Catching
**Symptom**: Errors go to console, no UI
**Solution**: Error Boundaries only catch render errors, not:
- Event handlers (use try-catch)
- Async code (use .catch())
- SSR errors

### Issue 4: Statistics Wrong Numbers
**Symptom**: Metrics don't match actual data
**Solution**: Check date filtering logic
```tsx
// Ensure correct date comparison
new Date(m.date) >= threeMonthsAgo
```

### Issue 5: Search Not Highlighting
**Symptom**: Search works but no visual highlight
**Solution**: Implement highlight in memory card render
```tsx
const highlightText = (text: string, query: string) => {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};
```

---

## 📝 Testing Checklist Summary

### Before Deployment
- [ ] All 5 components have passing tests
- [ ] No console errors or warnings
- [ ] Mobile responsive verified
- [ ] Theme integration working
- [ ] Performance acceptable (<3s load)
- [ ] Accessibility checked
- [ ] Browser compatibility confirmed

### After Deployment
- [ ] Production build works
- [ ] Analytics tracking (if any)
- [ ] User feedback collected
- [ ] Bug reports monitored

---

## 🚀 Quick Test Command

```bash
# Start dev server
npm run dev

# Open browser
http://localhost:3001

# Test sequence:
# 1. Login
# 2. Go to View Memories
# 3. Test Enhanced Search
# 4. Click Share on a memory
# 5. Click Statistics button
# 6. Trigger test error (if implemented)
# 7. Test offline mode for Retry Logic
```

---

**Chúc bạn test thành công! 🎉**

Nếu gặp lỗi, check console và refer đến Common Issues section.
