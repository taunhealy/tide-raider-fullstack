Tide Raider - Raid Flow Documentation
Overview
The Raid feature provides users with real-time surf conditions and beach recommendations based on region selection. This document explains the core architecture and data flow.
Architecture Components
Context Layer
BeachContext: Central state management for beaches, filters, and forecast data
Provides shared state across components through the useBeach hook
Data Fetching Layer
React Query: Manages API requests, caching, and refetching
Conditional fetching based on selected region
UI Components
BeachContainer: Main orchestrator component for the Raid view
BeachListView: Displays filtered beaches and region selection
LocationFilter: Region selection buttons UI
BeachCard: Individual beach display with conditions
Data Flow
Initial Load
Fetch all available regions from /api/regions
Display region buttons in LocationFilter
Show empty state (no beaches)
Region Selection
User clicks a region button
Context updates with selected region ID
Triggers API requests for beaches and forecast data
Data Processing
Combine beach data with forecast data
Calculate surf ratings
Filter and sort beaches based on user preferences
UI Rendering
Display beach cards with conditions
Show relevant ads and recommendations
API Endpoints
| Endpoint | Purpose |
|----------|---------|
| /api/regions | Get all available surf regions |
| /api/beaches?regionId={id} | Get beaches for a specific region |
| /api/surf-conditions?regionId={id} | Get forecast data for a region |
| /api/advertising/ads?regionId={id} | Get relevant ads for the region |

State Management
The BeachContext manages:
Current filter selections
Raw beach data
Processed/filtered beaches
Current surf conditions
Optimization Strategies
Caching: Reduce network requests
Conditional fetching: Only fetch when necessary
Memoization: Prevent unnecessary recalculations
Pagination: Improve performance with large datasets
Error Handling
Empty states when no region is selected
Graceful handling of API failures
Loading indicators during data fetching
This architecture follows React best practices and provides a responsive, efficient user experience while maintaining code maintainability and scalability.
