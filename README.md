# Room Finder - Complete Room/Flat Finding Platform

A comprehensive platform for bachelors and house owners to find and list rooms/flats. Built with Next.js 14+, TypeScript, Prisma, and PostgreSQL.

## 🚀 Features

### For Bachelors
- **Smart Room Search**: Filter by price, location, amenities, room type, and ratings
- **Intelligent Recommendations**: AI-powered suggestions based on budget (≤30% income), preferences, and distance
- **Interactive Map View**: Google Maps integration with price heatmaps and markers
- **Distance Calculator**: Automatic distance calculation to workplace
- **Real-time Chat**: Direct communication with landlords
- **Secure Payments**: Deposit payments via SSL Commerce
- **Review System**: Rate and review rooms

### For Landlords
- **Listing Management**: Create, edit, and manage room listings
- **Image Upload**: Drag & drop multiple room images
- **Analytics Dashboard**: Track views, inquiries, and bookings
- **Chat Management**: Respond to bachelor inquiries
- **Payment Tracking**: Monitor deposit payments

### For Admins
- **User Management**: Manage bachelors and landlords
- **Content Moderation**: Review and moderate listings and reviews
- **Analytics & Reports**: Top-rated areas, most affordable regions
- **System Monitoring**: Platform usage and performance metrics

## 🛠️ Tech Stack

### Frontend
- **Next.js 14+** (App Router)
- **React 19** with TypeScript
- **Redux Toolkit** for state management
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- **React Hook Form** with Zod validation
- **SWR** for data fetching

### Backend
- **Next.js API Routes** (App Router)
- **Prisma ORM** with PostgreSQL
- **NextAuth.js** for authentication
- **bcryptjs** for password hashing

### Maps & Location
- **Google Maps API** (with OpenStreetMap fallback)
- **React Leaflet** for map components
- **Geocoding & Distance Matrix APIs**

### Payments
- **SSL Commerce** integration
- **Stripe** for international payments (optional)

### Additional Tools
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prisma Studio** for database management

## 🏗️ Project Structure

```
room-finder/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── admin/             # Admin panel
│   │   ├── api/               # API routes
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── common/            # Shared components
│   │   ├── forms/             # Form components
│   │   ├── maps/              # Map-related components
│   │   └── chat/              # Chat components
│   ├── lib/                   # Utility libraries
│   ├── store/                 # Redux store
│   │   └── slices/            # Redux slices
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   └── hooks/                 # Custom React hooks
├── prisma/                    # Database schema and migrations
├── public/                    # Static assets
└── docs/                      # Documentation
```

## 🚦 Getting Started

### Prerequisites
- Node.js 20+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd room-finder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Update the `.env.local` file with your configuration:
   - Database URL
   - NextAuth secret
   - Google Maps API key (optional)
   - SSL Commerce credentials
   - AWS S3 credentials (optional)

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed the database with sample data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

### Database Management

- **View database**: `npm run db:studio`
- **Generate client**: `npm run db:generate`
- **Create migration**: `npm run db:migrate`
- **Seed database**: `npm run db:seed`

## 🔐 Authentication & Authorization

The application uses **NextAuth.js** with role-based access control:

- **BACHELOR**: Can search rooms, book, chat with landlords
- **LANDLORD**: Can create listings, manage properties, chat with bachelors  
- **ADMIN**: Full system access, user management, content moderation

## 🗺️ Maps Integration

### Google Maps (Recommended)
Set your Google Maps API key in `.env.local`:
```env
GOOGLE_MAPS_API_KEY=your_api_key_here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### OpenStreetMap (Fallback)
If Google Maps API key is not provided, the system automatically falls back to OpenStreetMap with Leaflet.

## 💳 Payment Integration

### SSL Commerce (Primary)
Configure SSL Commerce credentials:
```env
SSL_COMMERCE_STORE_ID=your_store_id
SSL_COMMERCE_STORE_PASSWORD=your_store_password
SSL_COMMERCE_IS_LIVE=false
```

### Stripe (Optional)
For international payments, configure Stripe:
```env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## 🚦 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 🎯 API Documentation

### Authentication Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Listings Endpoints
- `GET /api/listings` - Get all listings
- `POST /api/listings` - Create new listing
- `GET /api/listings/[id]` - Get listing details
- `PUT /api/listings/[id]` - Update listing
- `DELETE /api/listings/[id]` - Delete listing

### Search & Recommendations
- `GET /api/search` - Search listings with filters
- `GET /api/recommendations` - Get personalized recommendations

### Chat Endpoints
- `POST /api/chat/start` - Start new conversation
- `GET /api/chat/[threadId]/messages` - Get messages
- `POST /api/chat/[threadId]/messages` - Send message

## 🏢 Deployment

### Environment Setup
1. Set up production PostgreSQL database
2. Configure environment variables for production
3. Set up Google Maps API (production keys)
4. Configure SSL Commerce for live payments

### Build & Deploy
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Recommended Platforms
- **Vercel** (Recommended for Next.js)
- **Railway** 
- **DigitalOcean App Platform**
- **AWS Amplify**

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
