import { prisma } from './prisma';
import { retryDb } from './db-retry';

export type ActivityType = 
  | 'added_anime'
  | 'completed_anime'
  | 'updated_score'
  | 'updated_progress'
  | 'marked_favorite'
  | 'unmarked_favorite'
  | 'status_changed'
  | 'removed_anime';

interface ActivityData {
  profileId: string;
  actionType: ActivityType;
  animeId?: string;
  seriesId?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
}

export class ActivityService {
  /**
   * Check if a similar activity was logged recently to prevent duplicates
   */
  static async isDuplicateActivity(data: ActivityData, withinSeconds = 10): Promise<boolean> {
    try {
      const recentActivity = await prisma.activityLog.findFirst({
        where: {
          profileId: data.profileId,
          actionType: data.actionType,
          animeId: data.animeId,
          oldValue: data.oldValue,
          newValue: data.newValue,
          createdAt: {
            gte: new Date(Date.now() - (withinSeconds * 1000))
          }
        },
      });
      
      return !!recentActivity;
    } catch (error) {
      console.error('❌ Error checking for duplicate activity:', error);
      return false; // If we can't check, allow the activity to be logged
    }
  }

  /**
   * Log a user activity with deduplication
   */
  static async logActivity(data: ActivityData) {
    try {
      // Check for duplicates first
      const isDuplicate = await this.isDuplicateActivity(data);
      if (isDuplicate) {
        console.log(`⚠️  Skipping duplicate activity: ${data.actionType} for user ${data.profileId}`);
        return null;
      }

      const activity = await prisma.activityLog.create({
        data: {
          profileId: data.profileId,
          actionType: data.actionType,
          animeId: data.animeId,
          seriesId: data.seriesId,
          oldValue: data.oldValue,
          newValue: data.newValue,
          metadata: data.metadata,
        },
      });
      
      console.log(`✅ Logged activity: ${data.actionType} for user ${data.profileId}`);
      return activity;
    } catch (error) {
      console.error('❌ Failed to log activity:', error);
      // Don't throw - activity logging shouldn't break the main flow
      return null;
    }
  }

  /**
   * Get recent activities for a user
   */
  static async getUserActivities(profileId: string, limit = 10) {
    try {
      const activities = await retryDb(() => prisma.activityLog.findMany({
        where: { profileId },
        include: {
          anime: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              episodes: true,
            },
          },
          series: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              totalEpisodes: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }));

      return activities;
    } catch (error) {
      console.error('❌ Failed to fetch user activities:', error);
      return [];
    }
  }

  /**
   * Log anime addition to list
   */
  static async logAnimeAdded(
    profileId: string,
    animeId: string,
    animeTitle: string,
    status: string,
    isFavorite = false
  ) {
    return this.logActivity({
      profileId,
      actionType: 'added_anime',
      animeId,
      newValue: status,
      metadata: {
        animeTitle,
        isFavorite,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log anime completion
   */
  static async logAnimeCompleted(
    profileId: string,
    animeId: string,
    animeTitle: string,
    finalScore?: number,
    totalEpisodes?: number
  ) {
    return this.logActivity({
      profileId,
      actionType: 'completed_anime',
      animeId,
      newValue: 'completed',
      metadata: {
        animeTitle,
        finalScore,
        totalEpisodes,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log score update
   */
  static async logScoreUpdate(
    profileId: string,
    animeId: string,
    animeTitle: string,
    oldScore?: number,
    newScore?: number
  ) {
    return this.logActivity({
      profileId,
      actionType: 'updated_score',
      animeId,
      oldValue: oldScore?.toString(),
      newValue: newScore?.toString(),
      metadata: {
        animeTitle,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log progress update
   */
  static async logProgressUpdate(
    profileId: string,
    animeId: string,
    animeTitle: string,
    oldProgress: number,
    newProgress: number,
    totalEpisodes?: number
  ) {
    return this.logActivity({
      profileId,
      actionType: 'updated_progress',
      animeId,
      oldValue: oldProgress.toString(),
      newValue: newProgress.toString(),
      metadata: {
        animeTitle,
        totalEpisodes,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log favorite status change
   */
  static async logFavoriteChange(
    profileId: string,
    animeId: string,
    animeTitle: string,
    isFavorite: boolean
  ) {
    return this.logActivity({
      profileId,
      actionType: isFavorite ? 'marked_favorite' : 'unmarked_favorite',
      animeId,
      newValue: isFavorite.toString(),
      metadata: {
        animeTitle,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log status change
   */
  static async logStatusChange(
    profileId: string,
    animeId: string,
    animeTitle: string,
    oldStatus: string,
    newStatus: string
  ) {
    return this.logActivity({
      profileId,
      actionType: 'status_changed',
      animeId,
      oldValue: oldStatus,
      newValue: newStatus,
      metadata: {
        animeTitle,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log anime removal from list
   */
  static async logAnimeRemoved(
    profileId: string,
    animeId: string,
    animeTitle: string,
    status: string
  ) {
    return this.logActivity({
      profileId,
      actionType: 'removed_anime',
      animeId,
      oldValue: status,
      metadata: {
        animeTitle,
        timestamp: new Date().toISOString(),
      },
    });
  }
} 