# Map Container Initialization Fix

## Problem
The OpenStreetMap service was throwing the error "Map container is already initialized" when trying to create a map on a container that already had a Leaflet map instance.

## Root Cause
The previous cleanup logic was flawed:
1. It tried to create a new map instance just to remove the existing one, which caused the error
2. It didn't properly manage map instances across component re-renders
3. Manual DOM manipulation was incomplete

## Solution Implemented

### 1. Enhanced OpenStreetMapService (`/src/lib/maps/openstreetmap.ts`)

#### Added Proper Map Instance Management
```typescript
private mapInstances = new WeakMap<HTMLElement, Map>();
```
- Tracks map instances for each container using WeakMap
- Automatic garbage collection when containers are removed

#### Improved Cleanup Method
```typescript
cleanupMap(container: HTMLElement): void {
  const existingMap = this.mapInstances.get(container);
  if (existingMap) {
    existingMap.remove();
    this.mapInstances.delete(container);
  }
  
  // Clear container and Leaflet references
  if ((container as any)._leaflet_id) {
    container.innerHTML = '';
    delete (container as any)._leaflet_id;
    // Remove all Leaflet-related properties
    const containerAny = container as any;
    Object.keys(containerAny).forEach(key => {
      if (key.startsWith('_leaflet')) {
        delete containerAny[key];
      }
    });
  }
}
```
- Properly removes existing map instances using Leaflet's remove() method
- Cleans up DOM container and all Leaflet internal references
- Prevents memory leaks and container conflicts

#### Fixed Map Creation Logic
```typescript
async createMap(container: HTMLElement, config: MapConfig): Promise<Map> {
  await this.loadLeaflet();
  const L = await import('leaflet');

  // Use the cleanup method to properly remove any existing map
  this.cleanupMap(container);

  const map = L.map(container, {
    center: [config.center.lat, config.center.lng],
    zoom: config.zoom,
    zoomControl: config.zoomControl !== false,
  });

  // Store map instance for proper cleanup
  this.mapInstances.set(container, map);
  // ... rest of the method
}
```
- Always calls cleanup before creating new map
- Stores new map instance for future cleanup

### 2. Updated MapProviderService (`/src/lib/maps/map-provider.ts`)

#### Added Cleanup Method
```typescript
cleanup(container: HTMLElement): void {
  if (this.currentProvider === 'openstreetmap' && this.openStreetMapService) {
    this.openStreetMapService.cleanupMap(container);
  }
  // Google Maps cleanup is handled automatically
}
```
- Provides unified cleanup interface for different map providers
- Delegates to appropriate service based on current provider

### 3. Enhanced MapComponent (`/src/components/ui/MapComponent.tsx`)

#### Improved Cleanup in useEffect
```typescript
useEffect(() => {
  return () => {
    // Cleanup map instance when component unmounts
    if (mapInstanceRef.current && mapRef.current) {
      try {
        mapProviderService.cleanup(mapRef.current);
      } catch (error) {
        console.warn('Error during map cleanup:', error);
      }
      mapInstanceRef.current = null;
    }
    
    // Clear markers and heatmap references
    markersRef.current = [];
    heatmapRef.current = null;
  };
}, [mapProvider, mapProviderService]);
```
- Uses the new cleanup method instead of manual cleanup
- Proper error handling during cleanup
- Clears all references to prevent memory leaks

#### Updated Map Initialization
```typescript
// Clean up existing map instance
if (mapInstanceRef.current) {
  try {
    mapProviderService.cleanup(mapRef.current);
  } catch (error) {
    console.warn('Error during map cleanup:', error);
  }
  mapInstanceRef.current = null;
}
```
- Consistent use of the new cleanup method
- Error handling to prevent initialization failures

## Benefits

### 1. Eliminates "Map container is already initialized" Error
- Proper cleanup ensures containers are ready for new map instances
- No more Leaflet internal conflicts

### 2. Memory Leak Prevention
- WeakMap automatically garbage collects unused containers
- Proper cleanup of event listeners and DOM references
- Clear separation of map instance lifecycle

### 3. Robust Error Handling
- Graceful handling of cleanup errors
- Fallback mechanisms to ensure initialization continues
- Detailed error logging for debugging

### 4. Improved Performance
- Efficient map instance tracking
- Minimal DOM manipulation
- Proper resource cleanup

## Testing

### Manual Testing Steps
1. Navigate to pages with maps (room listings, search results)
2. Navigate away and back to the same pages
3. Refresh pages with maps multiple times
4. Switch between different map providers
5. Resize browser window or change device orientation

### Expected Behavior
- No console errors about map container initialization
- Smooth map rendering on all page loads
- Proper cleanup when navigating away from map pages
- No memory leaks during extended usage

## Technical Details

### WeakMap Usage
- Automatically handles garbage collection
- No memory leaks from retained container references
- Efficient lookup for existing map instances

### Leaflet Internal References
- Cleans up `_leaflet_id` and all `_leaflet*` properties
- Ensures container is in pristine state for reuse
- Prevents DOM conflicts during re-initialization

### Error Boundaries
- Wrapped cleanup operations in try-catch blocks
- Graceful degradation if cleanup fails
- Detailed logging for debugging issues

## Maintenance

### Regular Monitoring
- Watch for new Leaflet-related console errors
- Monitor memory usage during extended map usage
- Check for proper cleanup in browser dev tools

### Future Improvements
- Add cleanup metrics/monitoring
- Implement automatic retry for failed initializations
- Add unit tests for cleanup methods

This fix ensures reliable map functionality across all user interactions and prevents the "Map container is already initialized" error permanently.