# CODEBASE AUDIT LOG

This file tracks all major changes, fixes, and improvements to the codebase with dates and affected files.

---

## 2025-07-24 - Database Connection Pool Fix

**Issue**: API routes were creating multiple PrismaClient instances instead of using the shared singleton, causing database connection pool conflicts, timeouts, and performance issues.

**Root Cause**: Wrong imports - `new PrismaClient()` vs shared `prisma` instance

**Solution**: 
- Fixed Prisma client imports across all API routes
- Removed complex timeout/retry logic that was masking the real issue
- Fixed Next.js 15 `params` awaiting requirement

**Files Modified**:
- `src/app/api/series/route.ts` - Fixed import, simplified logic
- `src/app/api/series/[id]/route.ts` - Fixed import, await params, removed timeouts  
- Ensured consistent use of `@/src/lib/prisma` singleton

**Result**: 
- ✅ Real anime data loads correctly on Discover page
- ✅ No more fake mock data fallbacks
- ✅ Faster API responses (no more 15s timeouts)
- ✅ Proper series with 73 anime series from database

--- 