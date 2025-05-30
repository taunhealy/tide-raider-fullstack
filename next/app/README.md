# Beach Container & Redux Architecture

## Overview
This document explains the data flow between BeachContainer and Redux, following a clear separation of concerns pattern.

## Core Components

### BeachContainer
- Main container component for beach display
- Connects UI to Redux state
- Handles layout and component composition
- No direct data transformation

### Redux Structure
```typescript
// State shape
{
  beaches: {
    allBeaches: Beach[],
    filters: Filters,
  },
  forecast: {
    data: ForecastData
  }
}
```

## Data Flow

1. **State Management (Redux)**
   - Stores raw beach data
   - Stores filter preferences
   - Stores forecast data
   - No business logic, just state

2. **Selectors (Redux)**
   ```typescript
   // Example selector
   selectBeachScores = createSelector(
     [selectAllBeaches, selectForecastData],
     (beaches, forecast) => calculateAllBeachScores(beaches, forecast)
   );
   ```
   - Connect state to utilities
   - No direct data transformation
   - Memoized for performance

3. **Utilities (lib/)**
   - `surfUtils.ts`: Core surf calculations
   - `scoreUtils.ts`: Beach scoring logic
   - `filterUtils.ts`: Beach filtering
   - `directionUtils.ts`: Wind/swell direction calculations
   - `displayUtils.ts`: UI display formatting
   - All business logic lives here

## Best Practices

1. **Keep Redux Pure**
   - Redux only manages state
   - No data transformation in reducers
   - Selectors delegate to utilities

2. **Utility Functions**
   - Handle all data transformation
   - Pure functions for testability
   - Reusable across components

3. **BeachContainer Responsibilities**
   - Layout management
   - Component composition
   - Redux connection
   - No direct data manipulation

## Example Flow

```typescript
// 1. Component connects to Redux
const BeachContainer = () => {
  const beaches = useSelector(selectFilteredBeaches);
  const scores = useSelector(selectBeachScores);
  
  return <BeachList beaches={beaches} scores={scores} />;
};

// 2. Selector gets state
const selectBeachScores = createSelector(
  [selectAllBeaches, selectForecastData],
  (beaches, forecast) => calculateAllBeachScores(beaches, forecast)
);

// 3. Utility handles logic
function calculateAllBeachScores(beaches: Beach[], conditions: CoreForecastData) {
  return beaches.reduce((scores, beach) => ({
    ...scores,
    [beach.id]: calculateBeachScore(beach, conditions)
  }), {});
}
```

## Common Pitfalls

1. ❌ Don't put business logic in Redux
2. ❌ Don't transform data in components
3. ❌ Don't duplicate utility functions
4. ❌ Don't skip memoization in selectors

## Testing

1. **Utilities**: Unit test business logic
2. **Selectors**: Test state mapping
3. **Components**: Test rendering and integration
4. **Redux**: Test state management

## Dependencies
- Redux Toolkit
- Reselect for memoization
- TypeScript for type safety

## Type Definitions
See `types/` directory for complete type definitions:
- `Beach`
- `ForecastData`
- `Filters`
- `ScoreDisplay`