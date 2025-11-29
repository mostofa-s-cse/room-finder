import { PrismaClient, UserRole, TransportMode, RoomType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SAMPLE_AMENITIES = [
  'WiFi',
  'AC',
  'Parking',
  'Kitchen',
  'Bathroom',
  'Balcony',
  'Furnished',
  'Security',
  'Generator',
  'Water Supply',
  'Gas Connection',
  'Elevator'
];

const SAMPLE_RULES = [
  'No smoking',
  'No pets',
  'No parties',
  'No overnight guests',
  'Quiet hours after 10 PM',
  'Clean common areas',
  'No alcohol',
  'Separate electricity bill',
  'Advance rent required',
  'Security deposit required'
];

const DHAKA_AREAS = [
  { name: 'Dhanmondi', lat: 23.746466, lng: 90.376015 },
  { name: 'Gulshan', lat: 23.781311, lng: 90.417458 },
  { name: 'Banani', lat: 23.793889, lng: 90.407222 },
  { name: 'Uttara', lat: 23.875664, lng: 90.396454 },
  { name: 'Mirpur', lat: 23.822319, lng: 90.365486 },
  { name: 'Wari', lat: 23.7104, lng: 90.4167 },
  { name: 'Old Dhaka', lat: 23.7104, lng: 90.4074 },
  { name: 'Mohammadpur', lat: 23.765, lng: 90.356 },
  { name: 'Bashundhara', lat: 23.8103, lng: 90.4125 },
  { name: 'Tejgaon', lat: 23.7639, lng: 90.3889 },
  { name: 'Nikunja', lat: 23.8315, lng: 90.4196 }
];

const SAMPLE_LISTINGS = [
  {
    title: 'Cozy Single Room in Dhanmondi',
    description: 'A beautiful single room with all modern amenities. Perfect for working professionals.',
    price: 12000,
    roomType: RoomType.SINGLE,
    amenities: ['WiFi', 'AC', 'Kitchen', 'Security'],
    rules: ['No smoking', 'No pets', 'Quiet hours after 10 PM', 'Clean common areas'],
    contactPhone: '+8801700000001',
    contactEmail: 'karim.dhanmondi@example.com'
  },
  {
    title: 'Shared Room Near University',
    description: 'Affordable shared accommodation near Dhaka University. Great for students.',
    price: 8000,
    roomType: RoomType.SHARED,
    amenities: ['WiFi', 'Kitchen', 'Water Supply'],
    rules: ['No smoking', 'No alcohol', 'Quiet hours after 10 PM', 'Security deposit required'],
    contactPhone: '+8801700000002',
    contactEmail: 'fatema.university@example.com'
  },
  {
    title: 'Luxury Bachelor Pad in Gulshan',
    description: 'Premium single room with all facilities in the heart of Gulshan.',
    price: 25000,
    roomType: RoomType.SINGLE,
    amenities: ['WiFi', 'AC', 'Parking', 'Kitchen', 'Bathroom', 'Balcony', 'Furnished', 'Security', 'Generator', 'Elevator'],
    rules: ['No smoking', 'No parties', 'No overnight guests', 'Advance rent required'],
    contactPhone: '+8801700000003',
    contactEmail: 'rahim.gulshan@example.com'
  },
  {
    title: 'Budget Friendly Room in Mirpur',
    description: 'Affordable single room perfect for young professionals starting their career.',
    price: 9000,
    roomType: RoomType.SINGLE,
    amenities: ['WiFi', 'Kitchen', 'Water Supply', 'Security'],
    rules: ['No smoking', 'Clean common areas', 'Separate electricity bill'],
    contactPhone: '+8801700000004',
    contactEmail: 'landlord.mirpur@example.com'
  },
  {
    title: 'Modern Shared Space in Uttara',
    description: 'Well-designed shared living space with modern amenities.',
    price: 10000,
    roomType: RoomType.SHARED,
    amenities: ['WiFi', 'AC', 'Kitchen', 'Bathroom', 'Security', 'Generator'],
    rules: ['No smoking', 'No pets', 'Quiet hours after 10 PM', 'Clean common areas'],
    contactPhone: '+8801700000005',
    contactEmail: 'owner.uttara@example.com'
  }
];

async function main() {
  console.log('🌱 Starting seed process...');

  // Clear existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.chatMessage.deleteMany();
  await prisma.chatThread.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin User
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@roomfinder.com',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      phone: '+8801700000000'
    }
  });

  // Create Sample Bachelors
  console.log('🎓 Creating bachelor users...');
  const bachelorPassword = await bcrypt.hash('bachelor123', 12);
  const bachelors = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Ahmed Rahman',
        email: 'ahmed@example.com',
        passwordHash: bachelorPassword,
        role: UserRole.BACHELOR,
        phone: '+8801700000001',
        income: 40000,
        affordablePrice: 12000,
        transportMode: TransportMode.BUS
      }
    }),
    prisma.user.create({
      data: {
        name: 'Mohammad Ali',
        email: 'ali@example.com',
        passwordHash: bachelorPassword,
        role: UserRole.BACHELOR,
        phone: '+8801700000002',
        income: 60000,
        affordablePrice: 18000,
        transportMode: TransportMode.BIKE
      }
    }),
    prisma.user.create({
      data: {
        name: 'Rafiul Islam',
        email: 'rafiul@example.com',
        passwordHash: bachelorPassword,
        role: UserRole.BACHELOR,
        phone: '+8801700000003',
        income: 30000,
        affordablePrice: 9000,
        transportMode: TransportMode.WALK
      }
    })
  ]);

  // Create Sample Landlords
  console.log('🏠 Creating landlord users...');
  const landlordPassword = await bcrypt.hash('landlord123', 12);
  const landlords = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Karim Uddin',
        email: 'karim@example.com',
        passwordHash: landlordPassword,
        role: UserRole.LANDLORD,
        phone: '+8801800000001'
      }
    }),
    prisma.user.create({
      data: {
        name: 'Fatema Begum',
        email: 'fatema@example.com',
        passwordHash: landlordPassword,
        role: UserRole.LANDLORD,
        phone: '+8801800000002'
      }
    }),
    prisma.user.create({
      data: {
        name: 'Rahim Miah',
        email: 'rahim@example.com',
        passwordHash: landlordPassword,
        role: UserRole.LANDLORD,
        phone: '+8801800000003'
      }
    })
  ]);

  // Create Sample Listings
  console.log('🏘️ Creating sample listings...');
  const listings = [];
  
  for (let i = 0; i < SAMPLE_LISTINGS.length; i++) {
    const sample = SAMPLE_LISTINGS[i];
    const area = DHAKA_AREAS[i % DHAKA_AREAS.length];
    const landlord = landlords[i % landlords.length];
    
    // Add some randomization to coordinates (smaller range for more realistic positioning)
    const lat = area.lat + (Math.random() - 0.5) * 0.005;
    const lng = area.lng + (Math.random() - 0.5) * 0.005;
    
    // Generate availableFrom date (1-30 days from now)
    const availableFrom = new Date();
    availableFrom.setDate(availableFrom.getDate() + Math.floor(Math.random() * 30) + 1);
    
    const addressStr = `${Math.floor(Math.random() * 99) + 1}/${Math.floor(Math.random() * 9) + 1}, ${area.name}, Dhaka`;
    
    console.log(`Creating listing: ${sample.title} at (${lat.toFixed(6)}, ${lng.toFixed(6)}) - ${addressStr}`);
    
    const listing = await prisma.listing.create({
      data: {
        ...sample,
        landlordId: landlord.id,
        city: 'Dhaka',
        address: addressStr,
        lat,
        lng,
        amenities: sample.amenities,
        rules: sample.rules || [],
        availableFrom,
        contactPhone: sample.contactPhone,
        contactEmail: sample.contactEmail,
        images: ['/images/default-room.svg']
      }
    });
    
    listings.push(listing);
  }

  // Create additional listings for better variety
  console.log('🏘️ Creating additional listings...');
  for (let i = 0; i < 15; i++) {
    const area = DHAKA_AREAS[Math.floor(Math.random() * DHAKA_AREAS.length)];
    const landlord = landlords[Math.floor(Math.random() * landlords.length)];
    const sampleListing = SAMPLE_LISTINGS[Math.floor(Math.random() * SAMPLE_LISTINGS.length)];
    
    const lat = area.lat + (Math.random() - 0.5) * 0.01;
    const lng = area.lng + (Math.random() - 0.5) * 0.01;
    
    const randomAmenities = SAMPLE_AMENITIES
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 6) + 3);
    
    const randomRules = SAMPLE_RULES
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 4) + 2);
    
    const priceVariation = 0.8 + (Math.random() * 0.4); // 80% to 120% of base price
    const adjustedPrice = Math.round(sampleListing.price * priceVariation / 1000) * 1000;
    
    // Generate availableFrom date (1-45 days from now)
    const availableFrom = new Date();
    availableFrom.setDate(availableFrom.getDate() + Math.floor(Math.random() * 45) + 1);
    
    const addressStr = `${Math.floor(Math.random() * 99) + 1}/${Math.floor(Math.random() * 9) + 1}, ${area.name}, Dhaka`;
    
    const listing = await prisma.listing.create({
      data: {
        title: `${Math.random() > 0.5 ? 'Beautiful' : 'Comfortable'} ${sampleListing.roomType === RoomType.SINGLE ? 'Single' : 'Shared'} Room in ${area.name}`,
        description: `${sampleListing.description} Located in ${area.name}, this is a great choice for ${sampleListing.roomType === RoomType.SINGLE ? 'professionals' : 'students'}.`,
        price: adjustedPrice,
        city: 'Dhaka',
        address: addressStr,
        lat,
        lng,
        roomType: sampleListing.roomType,
        amenities: randomAmenities,
        rules: randomRules,
        availableFrom,
        contactPhone: `+88017${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
        contactEmail: `${landlord.name.toLowerCase().replace(' ', '.')}.${area.name.toLowerCase()}@example.com`,
        landlordId: landlord.id,
        images: ['/images/default-room.svg']
      }
    });
    
    console.log(`Created additional listing: ${listing.title} at (${lat.toFixed(6)}, ${lng.toFixed(6)}) - ${addressStr}`);
    
    listings.push(listing);
  }

  // Create a specific listing for Nikunja area to test coordinates
  console.log('🏘️ Creating specific Nikunja listing for testing...');
  const nikunjaArea = DHAKA_AREAS.find(area => area.name === 'Nikunja');
  if (nikunjaArea) {
    const nikunjaListing = await prisma.listing.create({
      data: {
        title: 'Test Room in Nikunja 1',
        description: 'A test listing in Nikunja area with proper coordinates for debugging.',
        price: 15000,
        city: 'Dhaka',
        address: 'Nikunja 1, Tanpara, Joar Sahara, Dhaka, Dhaka Metropolitan, Dhaka District, Dhaka Division, 1229, Bangladesh',
        lat: nikunjaArea.lat,
        lng: nikunjaArea.lng,
        roomType: RoomType.SINGLE,
        amenities: ['WiFi', 'AC', 'Kitchen', 'Security'],
        rules: ['No smoking', 'Clean common areas'],
        availableFrom: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        contactPhone: '+8801700000999',
        contactEmail: 'test.nikunja@example.com',
        landlordId: landlords[0].id,
        images: ['/images/default-room.svg']
      }
    });
    
    console.log(`Created Nikunja test listing with coordinates: (${nikunjaArea.lat}, ${nikunjaArea.lng})`);
    listings.push(nikunjaListing);
  }

  // Create Sample Reviews
  console.log('⭐ Creating sample reviews...');
  for (const listing of listings.slice(0, 10)) {
    // Random number of reviews per listing
    const reviewCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < reviewCount; i++) {
      const reviewer = bachelors[Math.floor(Math.random() * bachelors.length)];
      const rating = Math.floor(Math.random() * 3) + 3; // Rating between 3-5
      
      try {
        await prisma.review.create({
          data: {
            listingId: listing.id,
            reviewerId: reviewer.id,
            rating,
            comment: rating >= 4 
              ? 'Great place to stay! Highly recommended.' 
              : 'Decent place with good amenities.',
          }
        });
      } catch {
        // Skip if review already exists for this user-listing pair
        continue;
      }
    }
  }

  // Update listing ratings
  console.log('📊 Updating listing ratings...');
  for (const listing of listings) {
    const reviews = await prisma.review.findMany({
      where: { listingId: listing.id }
    });
    
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      
      await prisma.listing.update({
        where: { id: listing.id },
        data: {
          ratingAvg: parseFloat(avgRating.toFixed(1)),
          ratingCount: reviews.length
        }
      });
    }
  }

  // Create Sample Chat Threads and Messages
  console.log('💬 Creating sample chat data...');
  const sampleThreads = [];
  
  for (let i = 0; i < 3; i++) {
    const bachelor = bachelors[i];
    const landlord = landlords[i % landlords.length];
    
    const thread = await prisma.chatThread.create({
      data: {
        participants: {
          create: [
            { userId: bachelor.id },
            { userId: landlord.id }
          ]
        }
      }
    });
    
    sampleThreads.push(thread);
    
    // Get participant IDs for message creation
    const bachelorParticipant = await prisma.chatParticipant.findFirst({
      where: { threadId: thread.id, userId: bachelor.id }
    });
    const landlordParticipant = await prisma.chatParticipant.findFirst({
      where: { threadId: thread.id, userId: landlord.id }
    });
    
    if (bachelorParticipant && landlordParticipant) {
      // Add some sample messages
      await prisma.chatMessage.createMany({
        data: [
          {
            threadId: thread.id,
            senderId: bachelorParticipant.id,
            content: 'Hi! I\'m interested in your room listing. Is it still available?'
          },
          {
            threadId: thread.id,
            senderId: landlordParticipant.id,
            content: 'Hello! Yes, the room is still available. When would you like to visit?'
          },
          {
            threadId: thread.id,
            senderId: bachelorParticipant.id,
            content: 'That\'s great! I can visit this weekend. What time works for you?'
          }
      ]
    });
    }
  }

  // Create Sample Bookings
  console.log('💳 Creating sample bookings...');
  for (let i = 0; i < 3; i++) {
    const bachelor = bachelors[i];
    const listing = listings[i];
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7); // Start next week
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 6); // 6 months duration

    // Calculate months between start and end date
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                       (endDate.getMonth() - startDate.getMonth());
    const totalAmount = listing.price * monthsDiff;

    await prisma.booking.create({
      data: {
        listingId: listing.id,
        userId: bachelor.id,
        startDate,
        endDate,
        amount: listing.price * 0.1, // 10% deposit
        totalAmount: totalAmount, // Total amount for the entire booking period
        currency: 'BDT',
        status: i === 0 ? 'PAID' : 'PENDING'
      }
    });
  }

  console.log('✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Created 1 admin user`);
  console.log(`- Created ${bachelors.length} bachelor users`);
  console.log(`- Created ${landlords.length} landlord users`);
  console.log(`- Created ${listings.length} listings`);
  console.log(`- Created sample reviews and ratings`);
  console.log(`- Created ${sampleThreads.length} chat threads with messages`);
  console.log(`- Created 3 sample bookings`);
  
  console.log('\n🔑 Test Credentials:');
  console.log('Admin: admin@roomfinder.com / admin123');
  console.log('Bachelor: ahmed@example.com / bachelor123');
  console.log('Landlord: karim@example.com / landlord123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });