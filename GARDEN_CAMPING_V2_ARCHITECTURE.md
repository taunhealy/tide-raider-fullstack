# Garden Camping V2 - Property→Unit Architecture

## ✅ Major Improvement: Scalable Multi-Unit System

### Architecture Change:

**Before (V1):**
```
CampingListing (one booking type per listing)
```

**After (V2):**
```
Property 
  ├── Tent Spot #1 (AccommodationUnit)
  ├── Tent Spot #2 (AccommodationUnit) 
  ├── Private Room (AccommodationUnit)
  └── Granny Flat (AccommodationUnit)
```

---

## 🎯 Benefits

### 1. **Flexibility for Hosts**
A single host can offer:
- 3x tent spots in the garden (@R200/night each)
- 1x private room in the house (@R500/night)
- 1x entire granny flat (@R800/night)

All from ONE property listing!

### 2. **Better Inventory Management**
- Each unit has its own availability calendar
- Book tent spot #1 while tent spot #2 is occupied
- Different pricing for different units
- Unit-specific amenities

### 3. **Accurate Searching**
Users can filter by:
- **Unit Type**: "Tent Spot" vs "Private Room" vs "Entire Unit"
- **Capacity**: Number of guests
- **Price Range**: Find affordable tent spots OR luxury units

### 4. **True Airbnb Model**
This matches exactly how Airbnb works:
- Property represents the physical location
- Units represent what's actually bookable
- Reviews are at property level (builds host reputation)
- Pricing is at unit level (flexible)

---

## 📊 Database Schema

### Core Models:

1. **Property** - The host's location
   - Address, location, host info
   - Property-wide rules (check-in time, etc.)
   - Shared amenities (WiFi, parking available to all units)
   - Overall rating (aggregated from all bookings)

2. **AccommodationUnit** - Individual bookable spaces
   - Type: TENT_SPOT, PRIVATE_ROOM, SHARED_ROOM, ENTIRE_UNIT, etc.
   - Capacity, pricing, availability
   - Unit-specific amenities (private bathroom, etc.)
   - Own images and description

3. **Amenity** - Reusable amenity definitions
   - Can be assigned at property OR unit level
   
4. **PropertyAmenity** - Property-wide (all guests can use)
   - Example: Garden, Parking, WiFi

5. **UnitAmenity** - Unit-specific
   - Example: Private bathroom (for room), Tent included (for tent spot)

6. **Booking** - References a specific Unit
   - Guest books "Tent Spot #2" not just "the property"
   
7. **Enquiry** - Also unit-specific
   - "Interested in your Private Room for Dec 20-22"

8. **PropertyReview** - Property-level reviews
   - Builds overall reputation for the host/property
   - All bookings contribute to property rating

---

## 🏗️ User Model Relations (Updated)

```prisma
// In User model:
propertiesAsHost        Property[]           @relation("PropertyHost")
bookingsAsGuest         Booking[]            @relation("BookingGuest")
enquiriesAsGuest        Enquiry[]            @relation("EnquiryGuest")
messagesSent            Message[]            @relation("MessageSender")
reviewsGiven            PropertyReview[]     @relation("Reviewer")
reviewsReceived         PropertyReview[]     @relation("Reviewee")
```

---

## 🎨 Example: Beachside Property in Kommetjie

### Property Details:
- **Title**: "Surf & Stay - Beachside in Kommetjie"
- **Host**: John (3-year Superhost, 4.9★ rating)
- **Location**: 100m from Kommetjie Beach
- **Shared Amenities**: WiFi, Secure Parking, Garden, Braai Area, Surfboard Storage

### Units Available:

#### 1. Tent Spot #1 
- **Type**: TENT_SPOT
- **Price**: R200/night
- **Max Guests**: 2
- **Max Tents**: 1
- **Amenities**: Access to shower, toilet, electricity point
- **Description**: "Grassy spot under a tree"

#### 2. Tent Spot #2
- **Type**: TENT_SPOT
- **Price**: R250/night (ocean view!)
- **Max Guests**: 2
- **Max Tents**: 1
- **Amenities**: Same + ocean view
- **Description**: "Prime spot with ocean views"

#### 3. Private Room - "The Surfer's Room"
- **Type**: PRIVATE_ROOM
- **Price**: R500/night
- **Max Guests**: 2
- **Beds**: 1 Double
- **Amenities**: Private bathroom, WiFi, Heating
- **Description**: "Cozy room with ensuite"

#### 4. Granny Flat - "The Bungalow"
- **Type**: ENTIRE_UNIT
- **Price**: R900/night
- **Max Guests**: 4
- **Beds**: 1 Double + 2 Singles
- **Amenities**: Kitchen, bathroom, living room, private entrance
- **Description**: "Fully equipped cottage"

---

## 🔍 Search Example

**User searches:** "Accommodation in Kommetjie for 2 guests, Dec 20-22, max R300/night"

**Results:**
```
✅ Surf & Stay - Tent Spot #1 (R200/night) - Available
✅ Surf & Stay - Tent Spot #2 (R250/night) - Available
❌ Surf & Stay - Private Room (R500/night) - Too expensive
❌ Surf & Stay - Granny Flat (R900/night) - Too expensive
```

User can book Tent Spot #1 while someone else stays in the Private Room!

---

## 📝 Update Backend Schema

Replace the old camping schema with the new one:

1. **Remove old schema** from `backend/prisma/schema.prisma`
2. **Add new V2 schema** from `camping-schema-v2.prisma`
3. **Update User relations** to use new model names

Then run:
```bash
cd backend
npx prisma migrate dev --name property_unit_architecture
npx prisma generate
```

---

This is a **production-ready, scalable architecture** that supports unlimited growth! 🚀
