import { prisma } from '../lib/database';

export class BotConfigService {
  private static readonly CONFIG_KEYS = {
    COMMANDS_SET: 'commands_set',
    NAME_SET: 'name_set',
    DESCRIPTION_SET: 'description_set',
    SHORT_DESCRIPTION_SET: 'short_description_set',
    MENU_BUTTON_SET: 'menu_button_set',
    FULL_CONFIGURATION_COMPLETED: 'full_configuration_completed'
  } as const;

  async isConfigurationCompleted(): Promise<boolean> {
    try {
      const config = await prisma.botConfiguration.findUnique({
        where: { key: BotConfigService.CONFIG_KEYS.FULL_CONFIGURATION_COMPLETED }
      });
      
      return config?.value === 'true';
    } catch (error) {
      console.error('Error checking configuration status:', error);
      return false;
    }
  }

  async markConfigurationCompleted(): Promise<void> {
    try {
      await prisma.botConfiguration.upsert({
        where: { key: BotConfigService.CONFIG_KEYS.FULL_CONFIGURATION_COMPLETED },
        update: { 
          value: 'true',
          updatedAt: new Date()
        },
        create: {
          key: BotConfigService.CONFIG_KEYS.FULL_CONFIGURATION_COMPLETED,
          value: 'true'
        }
      });
      
      console.log('✅ Bot configuration marked as completed');
    } catch (error) {
      console.error('Error marking configuration as completed:', error);
    }
  }

  async isComponentConfigured(component: keyof typeof BotConfigService.CONFIG_KEYS): Promise<boolean> {
    try {
      const config = await prisma.botConfiguration.findUnique({
        where: { key: BotConfigService.CONFIG_KEYS[component] }
      });
      
      return config?.value === 'true';
    } catch (error) {
      console.error(`Error checking ${component} configuration:`, error);
      return false;
    }
  }

  async markComponentConfigured(component: keyof typeof BotConfigService.CONFIG_KEYS): Promise<void> {
    try {
      await prisma.botConfiguration.upsert({
        where: { key: BotConfigService.CONFIG_KEYS[component] },
        update: { 
          value: 'true',
          updatedAt: new Date()
        },
        create: {
          key: BotConfigService.CONFIG_KEYS[component],
          value: 'true'
        }
      });
      
      console.log(`✅ ${component} configuration marked as completed`);
    } catch (error) {
      console.error(`Error marking ${component} as configured:`, error);
    }
  }

  async resetConfiguration(): Promise<void> {
    try {
      await prisma.botConfiguration.deleteMany({
        where: {
          key: {
            in: Object.values(BotConfigService.CONFIG_KEYS)
          }
        }
      });
      
      console.log('✅ Bot configuration reset');
    } catch (error) {
      console.error('Error resetting configuration:', error);
    }
  }

  async getConfigurationStatus(): Promise<Record<string, boolean>> {
    try {
      const configs = await prisma.botConfiguration.findMany({
        where: {
          key: {
            in: Object.values(BotConfigService.CONFIG_KEYS)
          }
        }
      });

      const status: Record<string, boolean> = {};
      
      for (const key of Object.values(BotConfigService.CONFIG_KEYS)) {
        const config = configs.find((c: any) => c.key === key);
        status[key] = config?.value === 'true';
      }

      return status;
    } catch (error) {
      console.error('Error getting configuration status:', error);
      return {};
    }
  }
}