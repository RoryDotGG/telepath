import { UserPreferences, SlugStyle, SetupStep } from '../types';
import { prisma } from '../lib/database';

export class UserPreferencesService {

  async getUserPreferences(userId: number): Promise<UserPreferences | null> {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId }
    });
    
    if (!preferences) return null;
    
    return {
      userId: preferences.userId,
      defaultDomain: preferences.defaultDomain || undefined,
      preferredSlugStyle: preferences.preferredSlugStyle as SlugStyle,
      autoConfirm: preferences.autoConfirm,
      showReasoning: preferences.showReasoning,
      setupCompleted: preferences.setupCompleted,
      createdAt: preferences.createdAt,
      updatedAt: preferences.updatedAt,
    };
  }

  async createDefaultPreferences(userId: number): Promise<UserPreferences> {
    const created = await prisma.userPreferences.create({
      data: {
        userId,
        defaultDomain: null,
        preferredSlugStyle: SlugStyle.INTELLIGENT,
        autoConfirm: false,
        showReasoning: true,
        setupCompleted: false,
      }
    });
    
    return {
      userId: created.userId,
      defaultDomain: created.defaultDomain || undefined,
      preferredSlugStyle: created.preferredSlugStyle as SlugStyle,
      autoConfirm: created.autoConfirm,
      showReasoning: created.showReasoning,
      setupCompleted: created.setupCompleted,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async updatePreferences(userId: number, updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const existing = await prisma.userPreferences.findUnique({
      where: { userId }
    });
    
    if (!existing) {
      throw new Error('User preferences not found');
    }

    const updated = await prisma.userPreferences.update({
      where: { userId },
      data: {
        defaultDomain: updates.defaultDomain,
        preferredSlugStyle: updates.preferredSlugStyle,
        autoConfirm: updates.autoConfirm,
        showReasoning: updates.showReasoning,
        setupCompleted: updates.setupCompleted,
      }
    });
    
    return {
      userId: updated.userId,
      defaultDomain: updated.defaultDomain || undefined,
      preferredSlugStyle: updated.preferredSlugStyle as SlugStyle,
      autoConfirm: updated.autoConfirm,
      showReasoning: updated.showReasoning,
      setupCompleted: updated.setupCompleted,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async isSetupCompleted(userId: number): Promise<boolean> {
    const preferences = await this.getUserPreferences(userId);
    return preferences?.setupCompleted ?? false;
  }

  async markSetupCompleted(userId: number): Promise<void> {
    await this.updatePreferences(userId, { 
      setupCompleted: true,
      updatedAt: new Date()
    });
  }

  async resetPreferences(userId: number): Promise<UserPreferences> {
    await prisma.userPreferences.delete({
      where: { userId }
    }).catch(() => {}); // Ignore if not found
    
    return this.createDefaultPreferences(userId);
  }

  getSlugStyleDescription(style: SlugStyle): string {
    const descriptions = {
      [SlugStyle.INTELLIGENT]: 'AI analyzes content for smart, relevant slugs',
      [SlugStyle.SHORT]: 'Prioritizes brevity - 3-6 characters when possible',
      [SlugStyle.DESCRIPTIVE]: 'Longer, more descriptive slugs that explain the content',
      [SlugStyle.TECHNICAL]: 'Technical/developer-friendly slugs with conventions'
    };
    return descriptions[style];
  }

  getSlugStylePromptModifier(style: SlugStyle): string {
    const modifiers = {
      [SlugStyle.INTELLIGENT]: '',
      [SlugStyle.SHORT]: 'Focus on creating very short slugs (3-6 characters) while maintaining relevance.',
      [SlugStyle.DESCRIPTIVE]: 'Create longer, more descriptive slugs that clearly explain the content (8-15 characters).',
      [SlugStyle.TECHNICAL]: 'Use technical conventions like kebab-case, abbreviations, and developer-friendly terms.'
    };
    return modifiers[style];
  }
}