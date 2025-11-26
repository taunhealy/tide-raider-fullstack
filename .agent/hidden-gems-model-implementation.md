# Hidden Gems Model & Implementation Summary

## Issues Fixed

### 1. **109 Beaches Showing as Hidden Gems** ✅
**Problem**: The old implementation was filtering `Beach` model where `isHiddenGem` could be `null`, causing all beaches to show.

**Solution**: Created a separate `HiddenGem` model for user-submitted content. The `Beach.isHiddenGem` field is now deprecated in favor of the new model.

### 2. **No User Submission System** ✅
**Problem**: No way for users to submit their own hidden gems.

**Solution**: Created comprehensive submission system with moderation workflow.

### 3. **No Raid Logs for Hidden Gems** ✅
**Problem**: Hidden gems didn't have raid logs embedded.

**Solution**: Added `hiddenGemId` to `LogEntry` model and included raid logs in API responses.

## New Database Schema

### HiddenGem Model

```prisma
model HiddenGem {
  id                     String      @id @default(cuid())
  
  // Basic Info
  name                   String
  description            String      @db.Text
  location               String
  
  // Geographic Data
  regionId               String
  countryId              String
  continent              String
  coordinates            Json        // {lat, lng}
  
  // Surf Conditions
  waveType               WaveType
  difficulty             Difficulty
  optimalTide            OptimalTide
  bestSeasons            Season[]
  optimalWindDirections  String[]
  optimalSwellDirections Json?
  swellSize              Json?
  idealSwellPeriod       Json?
  
  // Safety & Environment
  hazards                Hazard[]
  crimeLevel             CrimeLevel?
  sharkRisk              SharkRisk?
  sheltered              Boolean
  crowdLevel             String?
  
  // Media
  images                 String[]
  videos                 Json?
  
  // User & Moderation
  submittedById          String
  status                 HiddenGemStatus  // PENDING, APPROVED, REJECTED, FLAGGED, DRAFT
  moderatedById          String?
  moderationNotes        String?
  rejectionReason        String?
  
  // Engagement
  viewCount              Int
  likeCount              Int
  verified               Boolean
  
  // Timestamps
  createdAt              DateTime
  updatedAt              DateTime
  publishedAt            DateTime?
  
  // Relations
  region                 Region
  country                Country
  submittedBy            User
  moderatedBy            User?
  logEntries             LogEntry[]  // Raid logs for this hidden gem
}
```

### HiddenGemStatus Enum

```prisma
enum HiddenGemStatus {
  PENDING       // Awaiting moderation
  APPROVED      // Approved and published
  REJECTED      // Rejected by moderator
  FLAGGED       // Flagged for review
  DRAFT         // User's draft (not submitted)
}
```

### Updated Models

**LogEntry** - Added `hiddenGemId` field to support raid logs for hidden gems
**User** - Added `hiddenGemsSubmitted` and `hiddenGemsModerated` relations
**Region** - Added `hiddenGems` relation
**Country** - Added `hiddenGems` relation

## Backend API

### Endpoints Created

**GET `/api/hidden-gems`**
- Fetches all approved hidden gems
- Query params:
  - `regionId`: Filter by region
  - `status`: Filter by status (default: APPROVED)
- Returns: Array of hidden gems with raid logs included

**GET `/api/hidden-gems/:id`**
- Fetches a single hidden gem by ID
- Includes full raid logs
- Increments view count automatically

**POST `/api/hidden-gems`**
- Creates a new hidden gem submission
- Requires authentication
- Sets status to PENDING by default
- Body fields: name, description, location, coordinates, surf conditions, media, etc.

### Raid Logs Integration

Each hidden gem response includes:
```json
{
  "id": "...",
  "name": "Secret Reef",
  "logEntries": [
    {
      "id": "...",
      "date": "2025-11-25",
      "surferRating": 8,
      "comments": "Epic session!",
      "user": {
        "name": "John Doe",
        "image": "..."
      }
    }
  ]
}
```

## Frontend Components (To Be Created)

### 1. Create Hidden Gem Form
Location: `app/components/hidden-gems/CreateHiddenGemForm.tsx`

Features needed:
- Name, description, location inputs
- Region/country/continent selectors
- Map for coordinates selection
- Wave type, difficulty, tide selectors
- Best seasons multi-select
- Wind/swell direction inputs
- Hazards multi-select
- Image upload (multiple)
- Video links
- Submit button

### 2. Hidden Gem Card with Raid Logs
Location: Update `HiddenGemsGrid.tsx`

Add raid logs section to each card:
```tsx
{/* Raid Logs Section */}
<div className="mt-4 border-t pt-4">
  <h4 className="font-semibold mb-2">Recent Sessions</h4>
  {hiddenGem.logEntries.slice(0, 3).map(log => (
    <div key={log.id} className="flex items-center gap-2 mb-2">
      <img src={log.user.image} className="w-8 h-8 rounded-full" />
      <div>
        <p className="text-sm">{log.user.name}</p>
        <p className="text-xs text-gray-500">
          {log.surferRating}/10 • {format(log.date)}
        </p>
      </div>
    </div>
  ))}
</div>
```

### 3. Create Hidden Gem Button
Add floating action button or header button:
```tsx
<GradientButton
  variant="purple-pink"
  active={true}
  size="lg"
  icon={<PlusIcon />}
  onClick={() => router.push('/hidden-gems/create')}
>
  Share a Hidden Gem
</GradientButton>
```

## Migration Steps

### 1. Create Migration
```bash
cd backend
npx prisma migrate dev --name add_hidden_gem_model
```

### 2. Generate Prisma Client
```bash
# Backend
cd backend
npx prisma generate

# Frontend
cd next
npx prisma generate
```

### 3. Update Frontend API
Update `app/hidden-gems/page.tsx` to use new endpoint:
```tsx
const response = await fetch(`/api/backend/hidden-gems?regionId=${regionId}`);
```

## Moderation Workflow

1. **User submits** → Status: `PENDING`
2. **Admin reviews** → Status: `APPROVED` or `REJECTED`
3. **If flagged** → Status: `FLAGGED` (for community reports)
4. **Draft mode** → Status: `DRAFT` (user can save without submitting)

### Admin Panel (Future)
- View all pending submissions
- Approve/reject with notes
- Edit submissions before approval
- View flagged content

## Data Flow

```
User fills form
  ↓
POST /api/hidden-gems
  ↓
Status: PENDING
  ↓
Admin moderates
  ↓
Status: APPROVED
  ↓
Appears on /hidden-gems page
  ↓
Users can add raid logs
  ↓
Raid logs appear on hidden gem card
```

## Next Steps

1. ✅ Create database migration
2. ✅ Generate Prisma clients
3. ⏳ Create `CreateHiddenGemForm` component
4. ⏳ Update `HiddenGemsGrid` to show raid logs
5. ⏳ Add "Create Hidden Gem" button
6. ⏳ Update `/hidden-gems` page to use new API
7. ⏳ Create admin moderation panel
8. ⏳ Add image upload functionality
9. ⏳ Add like/favorite functionality
10. ⏳ Add sharing functionality

## Testing

Once migration is complete:

1. **Create a hidden gem**:
```bash
curl -X POST http://localhost:3000/api/hidden-gems \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Secret Reef",
    "description": "Amazing right-hander",
    "location": "Near Kommetjie",
    "regionId": "western-cape",
    "countryId": "south-africa",
    "continent": "Africa",
    "coordinates": {"lat": -34.1234, "lng": 18.5678},
    "waveType": "REEF_BREAK",
    "difficulty": "INTERMEDIATE",
    "optimalTide": "MID",
    "bestSeasons": ["SUMMER", "AUTUMN"]
  }'
```

2. **Fetch hidden gems**:
```bash
curl http://localhost:3000/api/hidden-gems?regionId=western-cape
```

3. **Add a raid log**:
```bash
curl -X POST http://localhost:3000/api/raid-logs \
  -H "Content-Type: application/json" \
  -d '{
    "hiddenGemId": "HIDDEN_GEM_ID",
    "date": "2025-11-25",
    "surferRating": 9,
    "comments": "Best session ever!"
  }'
```

## Benefits of New Approach

✅ **Separate user content** from official beach database  
✅ **Moderation system** prevents spam/inappropriate content  
✅ **Raid logs embedded** in hidden gem cards  
✅ **User attribution** - shows who discovered the spot  
✅ **Engagement metrics** - view counts, likes  
✅ **Verification system** - admin can verify accuracy  
✅ **Draft mode** - users can save work in progress  
✅ **Rich metadata** - all surf conditions captured  
✅ **Media support** - multiple images and videos  
✅ **Geographic filtering** - by region, country, continent
