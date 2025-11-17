import { NextRequest, NextResponse } from 'next/server';
import { GeocodingService } from '@/lib/maps/utils';

// GET /api/maps/reverse-geocode?lat=23.8103&lng=90.4125
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude parameters are required' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude values' },
        { status: 400 }
      );
    }

    const address = await GeocodingService.reverseGeocode({
      lat: latitude,
      lng: longitude
    });

    if (!address) {
      return NextResponse.json(
        { error: 'Address not found for the given coordinates' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        address,
        location: { lat: latitude, lng: longitude }
      }
    });

  } catch (error) {
    console.error('Reverse geocoding API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}