import { NextRequest, NextResponse } from 'next/server';
import { DistanceCalculator } from '@/lib/maps/utils';
import { MapProviderService } from '@/lib/maps/map-provider';

// POST /api/maps/distance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination } = body;

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      );
    }

    if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      return NextResponse.json(
        { error: 'Invalid origin or destination coordinates' },
        { status: 400 }
      );
    }

    // Calculate straight-line distance using Haversine formula
    const straightLineDistance = DistanceCalculator.calculateDistance(origin, destination);

    // Try to get route-based distance using map service
    let routeDistance = straightLineDistance;
    let duration: number | undefined;
    let route: Array<{ lat: number; lng: number }> | undefined;

    try {
      const mapProvider = MapProviderService.getInstance();
      const routeResult = await mapProvider.calculateRoute(origin, destination);
      
      if (routeResult) {
        routeDistance = routeResult.distance;
        duration = routeResult.duration;
        route = routeResult.route;
      }
    } catch (error) {
      console.warn('Route calculation failed, using straight-line distance:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        straightLineDistance,
        routeDistance,
        duration,
        route,
        origin,
        destination
      }
    });

  } catch (error) {
    console.error('Distance calculation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/maps/distance?originLat=23.8103&originLng=90.4125&destLat=23.8103&destLng=90.4125
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const originLat = searchParams.get('originLat');
    const originLng = searchParams.get('originLng');
    const destLat = searchParams.get('destLat');
    const destLng = searchParams.get('destLng');

    if (!originLat || !originLng || !destLat || !destLng) {
      return NextResponse.json(
        { error: 'All coordinate parameters are required' },
        { status: 400 }
      );
    }

    const origin = {
      lat: parseFloat(originLat),
      lng: parseFloat(originLng)
    };

    const destination = {
      lat: parseFloat(destLat),
      lng: parseFloat(destLng)
    };

    if (isNaN(origin.lat) || isNaN(origin.lng) || isNaN(destination.lat) || isNaN(destination.lng)) {
      return NextResponse.json(
        { error: 'Invalid coordinate values' },
        { status: 400 }
      );
    }

    const distance = DistanceCalculator.calculateDistance(origin, destination);

    return NextResponse.json({
      success: true,
      data: {
        distance,
        origin,
        destination,
        unit: 'kilometers'
      }
    });

  } catch (error) {
    console.error('Distance calculation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}