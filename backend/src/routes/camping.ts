import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// ────────────────────────────────────────────────────────────────────────────
// PROPERTIES
// ────────────────────────────────────────────────────────────────────────────

// GET /api/camping/properties - Search properties
router.get('/properties', async (req, res) => {
  try {
    const { regionId, beachId, checkIn, checkOut, guests } = req.query;

    const properties = await prisma.property.findMany({
      where: {
        status: 'ACTIVE',
        published: true,
        ...(regionId && { regionId: String(regionId) }),
        ...(beachId && { beachId: String(beachId) }),
        // Filter by capacity if guests specified
        ...(guests && {
          units: {
            some: {
              maxGuests: { gte: Number(guests) },
              isActive: true,
            },
          },
        }),
      },
      include: {
        units: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            unitType: true,
            pricePerNightCents: true,
            maxGuests: true,
            images: { take: 1 },
          },
        },
        images: { take: 1 },
        region: { select: { name: true } },
        beach: { select: { name: true } },
      },
    });

    res.json(properties);
  } catch (error) {
    console.error('Error searching properties:', error);
    res.status(500).json({ error: 'Failed to search properties' });
  }
});

// GET /api/camping/properties/:id - Get property details
router.get('/properties/:id', async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            createdAt: true,
          },
        },
        units: {
          where: { isActive: true },
          include: {
            images: { orderBy: { order: 'asc' } },
            unitAmenities: { include: { amenity: true } },
          },
        },
        images: { orderBy: { order: 'asc' } },
        sharedAmenities: { include: { amenity: true } },
        region: true,
        beach: true,
        reviews: {
          where: { published: true, type: 'GUEST_TO_HOST' },
          include: {
            reviewer: { select: { name: true, image: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// POST /api/camping/properties - Create property (Host)
router.post('/properties', authenticateToken, async (req, res) => {
  try {
    const { title, description, regionId, beachId, address, displayAddress, propertyType } = req.body;
    // @ts-ignore - user is attached by middleware
    const userId = req.user.userId;

    const property = await prisma.property.create({
      data: {
        hostId: userId,
        title,
        description,
        regionId,
        beachId,
        address,
        displayAddress,
        propertyType,
        status: 'DRAFT',
      },
    });

    res.status(201).json(property);
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// UNITS
// ────────────────────────────────────────────────────────────────────────────

// POST /api/camping/properties/:id/units - Add unit to property
router.post('/properties/:id/units', authenticateToken, async (req, res) => {
  try {
    const propertyId = req.params.id;
    // @ts-ignore
    const userId = req.user.userId;

    // Verify ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.hostId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { name, description, unitType, pricePerNightCents, maxGuests } = req.body;

    const unit = await prisma.accommodationUnit.create({
      data: {
        propertyId,
        name,
        description,
        unitType,
        pricePerNightCents,
        maxGuests,
      },
    });

    res.status(201).json(unit);
  } catch (error) {
    console.error('Error creating unit:', error);
    res.status(500).json({ error: 'Failed to create unit' });
  }
});

export default router;
