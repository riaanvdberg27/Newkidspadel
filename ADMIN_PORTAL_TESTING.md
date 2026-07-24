# Admin Portal Data Management - Testing & Validation Guide

## Overview
This guide documents all the architectural fixes applied to the Admin Portal to ensure data integrity, proper capacity tracking, and prevent accidental data loss.

## Architecture Changes

### 1. Transactional Update Patterns ✅
**Files Updated:**
- `app/actions/admin.ts` - `updateClub()`
- `app/actions/admin-signups.ts` - `updateSignup()`
- `app/actions/packages.ts` - `updatePackage()`

**What Changed:**
- All update operations now fetch existing data before modifying
- Only explicitly changed fields are updated (prevents accidental overwrites)
- Related data is preserved - editing one record doesn't affect others
- Proper ID validation before any update

**Key Functions:**
```typescript
// Example: updateClub preserves imageUrl unless explicitly changed
const existing = await db.select().from(clubs).where(eq(clubs.id, id))
// Only update provided fields, keep existing values for others
await db.update(clubs).set({
  name: input.name,
  imageUrl: input.imageUrl !== null ? input.imageUrl : existing[0].imageUrl
})
```

### 2. Image Management ✅
**New File:** `lib/image-management.ts`

**Features:**
- Validates file type, size, and name before upload
- Detailed error messages (no generic failures)
- Preserves existing images unless explicitly deleted
- Safe URL resolution function

**Validation Rules:**
- Max file size: 4 MB
- Allowed types: JPEG, PNG, WebP, GIF, SVG
- Error messages are user-friendly and actionable

### 3. Capacity Tracking ✅
**New File:** `lib/capacity-tracking.ts`

**Automatic Capacity Calculation:**
- Tracks total capacity for each session
- Counts only "active" enrollments (not pending/cancelled)
- Automatically recalculates available spaces
- No manual adjustment needed

**Key Functions:**
```typescript
getClubSlotCapacity(clubId, weekday, hour, ageGroup)
  → Returns: { capacity, enrolled, available, isFull }

getPackageSlotCapacity(packageId, clubId, weekday, hour, ageGroup)
  → Returns: { capacity, enrolled, available, isFull }
```

**How It Works:**
1. Parent enrolls → status = "pending"
2. Payment confirmed → status = "active" (webhook in `app/api/payfast/notify/route.ts`)
3. Capacity query automatically counts only active enrollments
4. Available spaces = capacity - active_enrollments

### 4. Package Slot Preservation ✅
**File:** `app/actions/packages.ts` - `updatePackage()`

**What Changed:**
- Existing custom slots are preserved during update
- Slots are ONLY deleted if new slots are explicitly provided
- Prevents accidental slot loss when updating package info

**Behavior:**
```
Scenario 1: Admin updates package name only
→ All existing slots preserved

Scenario 2: Admin updates slots AND package info
→ Old slots deleted, new slots added

Scenario 3: Admin switches from custom to standard
→ All custom slots cleaned up automatically
```

## Testing & Validation Checklist

### Test Suite 1: Preserve Existing Data

#### Test 1.1: Club Updates
```
Steps:
1. Create a club with name "Test Club", location "Pretoria"
2. Edit club: change name to "Updated Club", leave location blank
3. Verify: location still shows "Pretoria" (NOT cleared)
4. Verify: no other club data was affected

Expected: Location preserved, other clubs unchanged
```

#### Test 1.2: School Updates
```
Steps:
1. Create two schools: School A and School B
2. Edit School A: change only phone number
3. Verify: all other School A fields preserved
4. Verify: School B completely unchanged

Expected: Only phone updated, all relationships intact
```

#### Test 1.3: Package Updates
```
Steps:
1. Create package with 3 custom slots
2. Edit package: change only the price
3. Verify: all 3 slots still exist
4. Verify: slot data unchanged

Expected: Price updated, slots preserved
```

#### Test 1.4: Enrollment Updates
```
Steps:
1. Create enrollment with parent name, email, child name, and slot
2. Edit enrollment: change only parent email
3. Verify: parent name preserved
4. Verify: child name preserved
5. Verify: slot assignments preserved

Expected: Only email updated, no other data affected
```

### Test Suite 2: Image Management

#### Test 2.1: Upload New Image
```
Steps:
1. Go to club management
2. Upload a valid JPEG image (< 4MB)
3. Verify: image appears in club preview
4. Verify: error message is clear if file too large (> 4MB)

Expected: Image uploads successfully with clear feedback
```

#### Test 2.2: Replace Image Without Loss
```
Steps:
1. Club has Image A (already saved)
2. Upload new Image B
3. Verify: only Image B displays (not both)
4. Verify: Image A is replaced, not accumulating images

Expected: Clean replacement, no duplication
```

#### Test 2.3: Image Format Validation
```
Steps:
1. Try uploading PDF file
2. Try uploading .txt file
3. Try uploading PNG (should work)

Expected: PDF/TXT rejected with "Invalid file type" message
```

#### Test 2.4: File Size Validation
```
Steps:
1. Try uploading 5MB image
2. Verify: error states "must be under 4 MB"

Expected: Clear error, not generic "Upload failed"
```

### Test Suite 3: Capacity Tracking

#### Test 3.1: Initial Capacity Display
```
Steps:
1. Create club with 10-capacity Monday 09:00-10:00 slot
2. View club availability
3. Verify: Shows "10/10 available"

Expected: Full capacity displayed correctly
```

#### Test 3.2: Capacity Decreases on Active Enrollment
```
Steps:
1. Parent enrols for Monday 09:00-10:00
2. Payment processing (status: pending)
3. Verify: Available still shows "10/10"
4. Payment confirmed via webhook (status: active)
5. View availability again
6. Verify: Now shows "9/10 available"

Expected: Capacity only counts active enrollments
```

#### Test 3.3: Capacity Increases on Cancellation
```
Steps:
1. Enrollment is active (9/10 available)
2. Admin cancels enrollment (status: cancelled)
3. View availability
4. Verify: Back to "10/10 available"

Expected: Cancelled enrollments release spaces
```

#### Test 3.4: Advanced Package Dual Slots Count Correctly
```
Steps:
1. Create Advanced package with two Monday 09:00 AND Wednesday 14:00 slots (10 capacity each)
2. Parent enrols for both Monday 09:00 AND Wednesday 14:00
3. Payment confirmed (active)
4. View Monday 09:00 availability: verify "9/10"
5. View Wednesday 14:00 availability: verify "9/10"

Expected: Both slots count the same enrollment once each
```

#### Test 3.5: Different Age Groups Independent
```
Steps:
1. Create two slots: Monday 09:00 (age 4-8, cap 10) and Monday 09:00 (age 9-13, cap 8)
2. Enrol child age 5 for 09:00
3. View 4-8 group: verify "9/10"
4. View 9-13 group: verify "8/8" (unchanged)

Expected: Age groups tracked independently
```

### Test Suite 4: Time Slot Management

#### Test 4.1: Club Slots Isolated
```
Steps:
1. Club A has Monday 09:00 with 10 capacity
2. Club B has Monday 09:00 with 8 capacity
3. Enrol child at Club A for Monday 09:00
4. View Club A Monday 09:00: verify "9/10"
5. View Club B Monday 09:00: verify "8/8" (unchanged)

Expected: Each club manages own slots independently
```

#### Test 4.2: School Slots Don't Affect Club Slots
```
Steps:
1. Club A has Monday 09:00 slot
2. School B has Monday 09:00 slot
3. Create school program enrollment at School B
4. View Club A Monday 09:00 availability
5. Verify: unchanged (capacity not affected by school enrollments)

Expected: School and club programs completely separate
```

#### Test 4.3: Package Slots Preserved During Edit
```
Steps:
1. Package "Advanced" has 5 custom slots defined
2. Edit package: change price only
3. Edit complete
4. View package slots
5. Verify: all 5 slots still exist with same configuration

Expected: Slots preserved through edit cycle
```

### Test Suite 5: Admin Signup Updates

#### Test 5.1: Update Without Losing Payment Info
```
Steps:
1. Enrollment has debit order details saved
2. Admin edits: change parent email
3. Verify: debit order fields still populated

Expected: Payment info preserved when editing contact details
```

#### Test 5.2: Status Transitions
```
Steps:
1. Enrollment is "pending"
2. Admin changes status to "active"
3. Verify: enrollment appears in dashboard
4. Change back to "pending"
5. Verify: reverted correctly

Expected: Status updates work bidirectionally
```

#### Test 5.3: Conditional Field Updates
```
Steps:
1. Enrollment has emergency contact
2. Admin edits enrollment but leaves emergency contact field empty
3. Verify: existing emergency contact preserved (not cleared)

Expected: Empty fields don't overwrite existing data
```

### Test Suite 6: Data Integrity Across Operations

#### Test 6.1: Multiple Admin Operations
```
Steps:
1. Create Club A
2. Create Package X with slots for Club A
3. Create Enrollment for Package X at Club A
4. Edit Club A name
5. Edit Package X price
6. Edit Enrollment contact
7. Verify: Club A updated, Package X still linked to Club A, Enrollment still valid

Expected: All operations isolated, relationships intact
```

#### Test 6.2: Concurrent Updates (Simulated)
```
Steps:
1. Open Club A edit form in two tabs
2. Tab 1: change location, save
3. Tab 2: change phone, save
4. Verify: location from Tab 1 persisted
5. Verify: phone from Tab 2 persisted (if system uses proper merge)

Expected: Last write wins or conflict detected, no data loss
```

#### Test 6.3: Related Record Deletion
```
Steps:
1. Create Club A with 5 slots
2. Delete Club A
3. Verify: slots are also deleted (orphaned data cleaned up)
4. Create new Club A
5. Verify: new Club A has no old slots

Expected: Cascade deletion works correctly
```

## Deployment Verification Checklist

Before deploying to production:

- [ ] All update functions validate IDs
- [ ] No raw `.set()` calls without fetching existing data first
- [ ] Image upload has file type and size validation
- [ ] Image errors are user-friendly
- [ ] Capacity queries only count "active" enrollments
- [ ] Package updates preserve slots unless new slots provided
- [ ] Club/school/package updates preserve relationships
- [ ] Payment webhook sets status to "active" on success
- [ ] All tests in Test Suite 1-6 pass
- [ ] No console errors on admin dashboard
- [ ] Capacity numbers match enrollment counts

## Rollback Instructions

If critical issues found in production:

1. **Revert affected action files:**
   ```bash
   git checkout main app/actions/admin.ts
   git checkout main app/actions/admin-signups.ts
   git checkout main app/actions/packages.ts
   ```

2. **Preserve new utility files (can keep as infrastructure):**
   - `lib/admin-updates.ts` - Safe to keep, provides validation patterns
   - `lib/image-management.ts` - Safe to keep, improves image handling
   - `lib/capacity-tracking.ts` - Safe to keep, calculates capacity

3. **Redeploy without architecture changes**

## Long-term Recommendations

1. **Add database triggers** to prevent orphaned data
2. **Implement audit logging** - track all admin changes
3. **Add soft deletes** - mark records deleted rather than removing
4. **Implement optimistic locking** - prevent lost updates in concurrent scenarios
5. **Add comprehensive test suite** - automated regression testing
6. **Add admin activity logs** - dashboard showing who changed what

## Support & Troubleshooting

**If capacity shows incorrect number:**
- Verify enrollment `status` field (should be "active" for confirmed payments)
- Check PayFast webhook logs for payment confirmation
- Manually verify SQL: `SELECT COUNT(*) FROM enrollments WHERE status = 'active' AND clubId = X AND slotWeekday = Y`

**If images not uploading:**
- Check file size (must be < 4MB)
- Check file type (must be JPEG, PNG, WebP, GIF, or SVG)
- Check Vercel Blob service status
- Review console errors in admin panel

**If update losing data:**
- Check that field was not cleared in form before save
- Verify that existing data was fetched before update
- Check database directly: `SELECT * FROM {table} WHERE id = X`
