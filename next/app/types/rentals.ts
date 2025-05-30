// Define the base rental item type without Prisma dependency

// Import the constants
import { ITEM_CATEGORIES } from "@/app/lib/rentals/constants";

// Create the enum dynamically from the constants
export type RentalItemType = (typeof ITEM_CATEGORIES)[number];

// For backward compatibility, also export as an enum-like object
export const RentalItemTypeEnum = Object.fromEntries(
  ITEM_CATEGORIES.map((category) => [category, category])
) as Record<RentalItemType, RentalItemType>;

export interface RentalItemWithRelations {
  id: string;
  name: string;
  description?: string | null;
  itemType: RentalItemType;
  rentPrice: number;
  dailyPrice?: number;
  images: string[];
  thumbnail?: string | null;
  specifications: any;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  isActive: boolean;
  user: {
    name: string;
    image: string | null;
  };
  availableBeaches: Array<{
    id: string;
    rentalItemId: string;
    beachId: string;
    beach: {
      id: string;
      name: string;
      region: {
        id: string;
        name: string;
        continent?: string | null;
        country?: string | null;
      };
    };
  }>;
  availability?: Array<{
    id: string;
    startDate: Date;
    endDate: Date;
  }>;
  // Make these optional since they're missing in your actual data
  price?: number;
  imageUrls?: string[];
  category?: string;
  rentalRequests?: RentalRequestWithRelations[];
}

// Define the rental request type without Prisma dependency
export interface RentalRequestWithRelations {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  rentalItemId: string;
  renterId: string;
  ownerId: string;
  beachId: string;
  totalCost: { zar: number };
  lastActionAt?: Date;
  expiresAt?: Date;
  modificationCount?: number;
  previousVersions?: any;
  cancellationReason?: string;
  isExpired?: boolean;
  hasBeenViewed?: boolean;
  viewedAt?: Date | null;
  paymentIntentId?: string | null;
  depositPaid?: boolean;
  rentalItem: Omit<RentalItemWithRelations, "rentalRequests">;
  renter: {
    id: string;
    name: string;
    image: string | null;
    email: string;
  };
  owner: {
    id: string;
    name: string;
    image: string | null;
    email: string;
  };
  beach: {
    name: string;
    region: {
      name: string;
    };
  };
  messages: RentalMessageWithSender[];
}

// Define the message type with sender
export interface RentalMessageWithSender {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  sender: {
    id: string;
    name: string;
    image: string | null;
  };
}

// Define the basic message type
export interface RentalMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    image: string | null;
  };
}

export interface SurfboardSpecifications {
  type: string;
  length: number;
  finSetup: string;
}

export interface MotorbikeSpecifications {
  make: string;
  model: string;
  year: number;
  engineSize: number;
}

export interface ScooterSpecifications {
  make: string;
  model: string;
  year: number;
  maxSpeed: number;
}

export interface JetSkiSpecifications {
  make: string;
  model: string;
  year: number;
  horsepower: number;
  fuelCapacity: number;
  riderCapacity: number;
}

export type RentalSpecifications =
  | SurfboardSpecifications
  | MotorbikeSpecifications
  | ScooterSpecifications
  | JetSkiSpecifications;
