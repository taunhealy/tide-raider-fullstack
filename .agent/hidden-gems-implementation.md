# Hidden Gems Feature Implementation

## Overview
Added a "Hidden Gems" filter to the Raid page that allows users to filter for unknown/lesser-known surf breaks in a region. This leverages the existing `isHiddenGem` boolean field in the Beach model.

## Changes Made

### 1. Backend API (`backend/src/routes/filtered-beaches.ts`)
- **Added**: Support for `isHiddenGem` query parameter in the beach filtering logic
- **Location**: Line 122-124
- **Implementation**: When `req.query.isHiddenGem === "true"`, the filter adds `isHiddenGem: true` to the Prisma where clause

```typescript
...(req.query.isHiddenGem === "true" && {
  isHiddenGem: true,
}),
```

### 2. Filter Type System (`next/app/types/filters.ts`)
- **Added**: `isHiddenGem` to the `FilterType` union (line 20)
- **Added**: `isHiddenGem: boolean` to the `Filters` interface (line 37)

### 3. Filter Configuration (`next/app/config/filters.ts`)
- **Added**: Hidden Gems filter configuration to the `FILTERS` array
- **Configuration**:
  - `key`: "isHiddenGem"
  - `type`: "boolean"
  - `label`: "Hidden Gems"
  - `urlParam`: "isHiddenGem"
  - `beachProp`: "isHiddenGem"

### 4. UI Component (`next/app/components/raid/BeachHeaderControls.tsx`)
- **Added**: Hidden Gems filter toggle button below the SearchBar
- **Features**:
  - Sparkle icon (✨) to represent "hidden gems"
  - Purple-to-pink gradient when active
  - "Active" badge when filter is enabled
  - Smooth transitions and hover effects
  - Dark mode support

## How It Works

1. **User Interaction**: User clicks the "Hidden Gems" button in the BeachHeaderControls component
2. **State Update**: The `updateFilter` function from `useBeachFilters` hook updates the URL parameter `isHiddenGem=true`
3. **API Request**: The frontend makes a request to `/api/beaches/filter?regionId=xxx&isHiddenGem=true`
4. **Backend Filtering**: The backend adds `isHiddenGem: true` to the Prisma query where clause
5. **Response**: Only beaches with `isHiddenGem: true` are returned
6. **Display**: The filtered beaches are displayed on the Raid page

## Database Schema

The `Beach` model already includes the `isHiddenGem` field:

```prisma
model Beach {
  // ... other fields
  isHiddenGem  Boolean?
  // ... other fields
}
```

This field contains:
- **Name**: Beach name
- **Region**: Region ID (connects to Region model)
- **Country**: Country ID (connects to Country model)
- **Continent**: Stored in the Beach model
- **Coordinates**: Stored as JSON with `lat` and `lng` properties

## Future Enhancements

To populate the Hidden Gems data, you can:

1. **Manual Entry**: Update beaches in the database:
   ```sql
   UPDATE "Beach" SET "isHiddenGem" = true WHERE id = 'beach-id';
   ```

2. **Admin Interface**: Create an admin panel to mark beaches as hidden gems

3. **Community Voting**: Allow users to suggest beaches as hidden gems

4. **Criteria-Based**: Automatically mark beaches as hidden gems based on:
   - Low visitor count
   - No commercial advertising
   - Remote location (high `distanceFromCT`)
   - Limited online presence

## Testing

To test the feature:

1. Navigate to the Raid page with a region selected
2. Click the "Hidden Gems" button below the search bar
3. The button should show a purple gradient and "Active" badge
4. Only beaches with `isHiddenGem: true` should be displayed
5. Click again to deactivate the filter and show all beaches

## Notes

- The filter works in combination with other filters (wave type, difficulty, etc.)
- The filter is region-specific (only shows hidden gems in the selected region)
- The `useBeachFilters` hook automatically handles boolean filters through the FILTERS configuration
- The frontend and backend schemas are already in sync with the `isHiddenGem` field

## Hidden Gems Page

A dedicated page has been created at `/hidden-gems` with an Airbnb-style layout:

### Components Created

1. **HiddenGemsMap** (`app/components/hidden-gems/HiddenGemsMap.tsx`)
   - Interactive Google Maps component
   - Custom purple/pink markers for hidden gems
   - Marker clustering and bounds fitting
   - Info windows on hover
   - Click to select beach
   - Animated markers for selected beach

2. **HiddenGemsGrid** (`app/components/hidden-gems/HiddenGemsGrid.tsx`)
   - Scrollable grid of beach cards
   - Beach images with fallback gradient
   - Wave type and difficulty badges
   - "View Details" button navigates to Raid page
   - Selection state synchronized with map
   - Loading and empty states

3. **HiddenGemsPage** (`app/hidden-gems/page.tsx`)
   - Airbnb-style split layout:
     - Left side (40-45%): Scrollable beach grid
     - Right side (55-60%): Fixed map
   - Responsive design (mobile shows grid, desktop shows both)
   - Region-based filtering via URL parameter
   - Search bar integration
   - Error handling

### API Endpoint

- **Route**: `/api/hidden-gems`
- **Purpose**: Dedicated endpoint for fetching hidden gems
- **Implementation**: Automatically adds `isHiddenGem=true` to the filter query

### Features

- **Interactive Map**: Click markers to select beaches, hover for info
- **Synchronized Selection**: Selecting a beach in the grid highlights it on the map and vice versa
- **Responsive Design**: 
  - Desktop: Split view with grid and map
  - Mobile: Grid view with "Show Map" button
- **Beautiful UI**: 
  - Purple-to-pink gradient theme
  - Sparkle icons for hidden gems
  - Smooth animations and transitions
  - Dark mode support

### Usage

1. Navigate to `/hidden-gems` or `/hidden-gems?regionId=western-cape`
2. Browse hidden gems in the scrollable grid
3. Click on a beach card or map marker to select it
4. Click "View Details" to see full beach information on the Raid page
5. Use the search bar to find specific hidden gems

### Database Requirements

To populate hidden gems, update beaches in the database:

```sql
-- Mark beaches as hidden gems
UPDATE "Beach" 
SET "isHiddenGem" = true 
WHERE id IN ('beach-id-1', 'beach-id-2', ...);

-- Ensure coordinates are set
UPDATE "Beach" 
SET coordinates = '{"lat": -34.1234, "lng": 18.5678}'::jsonb
WHERE id = 'beach-id';
```

### Future Enhancements

1. **Mobile Map Modal**: Full-screen map view for mobile devices
2. **Filters**: Add wave type, difficulty filters to the page
3. **Sorting**: Sort by distance, difficulty, or popularity
4. **User Submissions**: Allow users to suggest hidden gems
5. **Photos Gallery**: Multiple photos per beach
6. **Reviews**: User reviews and ratings for hidden gems
7. **Directions**: "Get Directions" button integration
8. **Share**: Share hidden gems on social media

