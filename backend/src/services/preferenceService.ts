import { prisma } from "../lib/prisma";
import { NotificationCategory } from "@prisma/client";

export class PreferenceService {
  /**
   * Check if a user is opted into a specific notification category
   * Defaults to TRUE if no preference is found
   */
  static async isOptedIn(userId: string, category: NotificationCategory): Promise<boolean> {
    try {
      const preference = await prisma.userNotificationPreference.findUnique({
        where: {
          userId_category: {
            userId,
            category
          }
        }
      });

      // If no record exists, they are opted in by default
      return preference ? preference.isOptedIn : true;
    } catch (error) {
      console.error(`[PreferenceService] Error checking preference for ${userId}:`, error);
      return true; // Fail-safe: opt-in
    }
  }

  /**
   * Update a user's preference for a specific category
   */
  static async updatePreference(userId: string, category: NotificationCategory, isOptedIn: boolean) {
    return await prisma.userNotificationPreference.upsert({
      where: {
        userId_category: {
          userId,
          category
        }
      },
      update: {
        isOptedIn
      },
      create: {
        userId,
        category,
        isOptedIn
      }
    });
  }

  /**
   * Get all preferences for a user
   */
  static async getUserPreferences(userId: string) {
    const preferences = await prisma.userNotificationPreference.findMany({
      where: { userId }
    });

    // Merge with defaults (all categories start as true)
    const categories = Object.values(NotificationCategory);
    return categories.map(category => {
      const found = preferences.find(p => p.category === category);
      return {
        category,
        isOptedIn: found ? found.isOptedIn : true
      };
    });
  }
}
