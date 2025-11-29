#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface GeocodeResult {
  lat: number;
  lng: number;
  display_name: string;
}

async function geocodeAddress(address: string, city: string): Promise<GeocodeResult | null> {
  const fullAddress = `${address}, ${city}`;
  const encodedAddress = encodeURIComponent(fullAddress);
  
  try {
    console.log(`🔍 Geocoding: ${fullAddress}`);
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`
    );
    
    if (!response.ok) {
      console.error(`❌ Geocoding failed for "${fullAddress}": HTTP ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        display_name: result.display_name
      };
    }
    
    console.warn(`⚠️ No geocoding results for: ${fullAddress}`);
    return null;
  } catch (error) {
    console.error(`❌ Geocoding error for "${fullAddress}":`, error);
    return null;
  }
}

async function updateListingCoordinates() {
  console.log('🚀 Starting geocoding of existing listings...\n');
  
  try {
    // Find all listings without coordinates
    const listings = await prisma.listing.findMany({
      where: {
        OR: [
          { lat: null },
          { lng: null },
          { lat: 0 },
          { lng: 0 }
        ]
      },
      select: {
        id: true,
        title: true,
        address: true,
        city: true,
        lat: true,
        lng: true
      }
    });

    console.log(`📋 Found ${listings.length} listings without coordinates\n`);

    if (listings.length === 0) {
      console.log('✅ All listings already have coordinates!');
      return;
    }

    let updatedCount = 0;
    let failedCount = 0;

    for (const listing of listings) {
      console.log(`\n📍 Processing: ${listing.title}`);
      console.log(`   Current: lat=${listing.lat}, lng=${listing.lng}`);
      
      const geocodeResult = await geocodeAddress(listing.address, listing.city);
      
      if (geocodeResult) {
        try {
          await prisma.listing.update({
            where: { id: listing.id },
            data: {
              lat: geocodeResult.lat,
              lng: geocodeResult.lng
            }
          });
          
          console.log(`✅ Updated: lat=${geocodeResult.lat.toFixed(6)}, lng=${geocodeResult.lng.toFixed(6)}`);
          console.log(`   Address: ${geocodeResult.display_name}`);
          updatedCount++;
        } catch (error) {
          console.error(`❌ Database update failed for ${listing.title}:`, error);
          failedCount++;
        }
      } else {
        console.log(`❌ Could not geocode: ${listing.address}, ${listing.city}`);
        failedCount++;
      }
      
      // Rate limiting: wait 1 second between requests to respect Nominatim's usage policy
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n📊 Geocoding Summary:`);
    console.log(`   ✅ Successfully updated: ${updatedCount} listings`);
    console.log(`   ❌ Failed to update: ${failedCount} listings`);
    console.log(`   📋 Total processed: ${listings.length} listings`);

  } catch (error) {
    console.error('💥 Fatal error during geocoding:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔚 Geocoding process completed.');
  }
}

// Run the script
if (require.main === module) {
  updateListingCoordinates()
    .catch((error) => {
      console.error('💥 Unhandled error:', error);
      process.exit(1);
    });
}

export default updateListingCoordinates;