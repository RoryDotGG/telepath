import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { config, validateConfig } from './config';
import { LinkHandler } from './handlers/linkHandler';
import { SetupHandler } from './handlers/setupHandler';
import { LinkManagementHandler } from './handlers/linkManagementHandler';
import { LinkManagementService } from './services/linkManagementService';
import { AuthService } from './services/authService';
import { UserSession } from './types';

async function startBot() {
  try {
    // Validate configuration
    validateConfig();
    
    // Initialize bot and shared services
    const bot = new Telegraf(config.botToken);
    const userSessions = new Map<number, UserSession>();
    const authService = new AuthService();
    const linkManagementService = new LinkManagementService();
    const setupHandler = new SetupHandler(userSessions);
    const linkHandler = new LinkHandler(userSessions, setupHandler.getUserPreferencesService(), linkManagementService);
    const linkManagementHandler = new LinkManagementHandler(linkManagementService, userSessions);

    // Authentication middleware
    bot.use(async (ctx, next) => {
      const userId = ctx.from?.id;
      
      if (!userId) {
        return;
      }

      if (!authService.isUserAllowed(userId)) {
        console.log(`🚫 Unauthorized access attempt from user ${userId}`);
        await ctx.reply(authService.getUnauthorizedMessage(), { parse_mode: 'Markdown' });
        return;
      }

      await next();
    });

    // Middleware for logging
    bot.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      console.log(`${ctx.updateType} - ${ms}ms`);
    });

    // Welcome message with setup check
    bot.start(async (ctx) => {
      const userId = ctx.from?.id;
      if (!userId) return;

      const userPrefs = setupHandler.getUserPreferencesService();
      const isSetupCompleted = await userPrefs.isSetupCompleted(userId);

      if (!isSetupCompleted) {
        // Start first-time setup
        await setupHandler.startSetup(ctx);
        return;
      }

      // Show normal welcome message for existing users
      const welcomeMessage = `🤖 **Welcome back to Telepath!**

I'm your AI-powered short link generator. Simply send me any URL and I'll create an intelligent, memorable short link for you.

**Your configured preferences are active:**
• 🧠 AI-powered slug generation using Gemini 2.5 Flash
• 🔗 Integration with Dub.sh for reliable short links
• 🌐 Support for custom domains
• ✏️ Custom slug editing
• 📊 Link tracking and analytics

**Commands:**
• Send any URL to create a short link
• /settings - Manage your preferences
• /help - Get help and tips

Ready to create some smart short links? 🚀`;

      ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
    });

    // Help command
    bot.help((ctx) => {
      const helpMessage = `🆘 **Help - How to use Telepath**

**Basic Usage:**
• Send any URL to create a short link
• I'll generate an intelligent slug based on the content
• Use the buttons to Confirm, Edit, or Reject suggestions

**Commands:**
• /start - Welcome message
• /help - Show this help message
• /about - About this bot
• /links - Manage your created links
• /settings - Configure preferences

**Features:**
• 🧠 AI-powered slug generation
• 🔗 Reliable short links via Dub.sh
• 🌐 Custom domain support
• ✏️ Custom slug editing
• 📊 Analytics tracking

**Tips:**
• Make sure URLs include http:// or https://
• Custom slugs should use letters, numbers, and hyphens only
• Already shortened URLs won't be processed

Need more help? Just send me a URL and try it out! 🚀`;

      ctx.reply(helpMessage, { parse_mode: 'Markdown' });
    });

    // About command
    bot.command('about', (ctx) => {
      const aboutMessage = `ℹ️ **About Telepath - AI Short Links**

**Version:** 1.0.0

**🚀 What is Telepath?**
Telepath is an AI-powered Telegram bot that creates intelligent short links. Instead of random characters like "bit.ly/x7k2m", you get meaningful, memorable links like "dub.sh/ai-tutorial" or "mysite.com/product-launch".

**🧠 Powered by:**
• **Google Gemini 2.5 Flash** - AI for intelligent slug generation
• **Dub.sh API** - Reliable short link creation and analytics
• **Telegraf** - Modern Telegram bot framework
• **Prisma + SQLite** - User preferences and link management

**✨ Key Features:**
• AI analyzes your URL content to create meaningful slugs
• Support for custom domains (if configured in Dub.sh)
• Personalized preferences (slug style, auto-confirm, etc.)
• Link management with analytics
• Bulk link operations
• Smart setup wizard for new users

**🔒 Privacy & Security:**
• URLs are processed temporarily for AI analysis
• User preferences stored locally in encrypted database
• No personal data shared with third parties
• Links created through your own Dub.sh account

**🛠️ Open Source:**
Telepath is designed to be customizable and extendable. You can modify AI prompts, add new features, or integrate with other services.

**📊 Usage Stats:**
• Links created: Check /links
• Setup completed: Check /settings

Ready to create your first intelligent short link? Send me any URL! 🔗`;

      ctx.reply(aboutMessage, { parse_mode: 'Markdown' });
    });

    // Settings command
    bot.command('settings', async (ctx) => {
      const userId = ctx.from?.id;
      if (!userId) return;

      try {
        const userPrefs = setupHandler.getUserPreferencesService();
        const preferences = await userPrefs.getUserPreferences(userId);

        if (!preferences) {
          await ctx.reply('⚙️ You need to complete setup first. Use /start to begin setup.');
          return;
        }

        const settingsMessage = `⚙️ **Your Current Settings**

🌐 **Default Domain:** ${preferences.defaultDomain || 'dub.sh'}
🎨 **Slug Style:** ${preferences.preferredSlugStyle}
⚡ **Auto-Confirm:** ${preferences.autoConfirm ? 'Yes' : 'No'}
💭 **Show Reasoning:** ${preferences.showReasoning ? 'Yes' : 'No'}

What would you like to change?`;

        await ctx.reply(settingsMessage, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🌐 Change Domain', callback_data: JSON.stringify({ action: 'settings_domain' }) }],
              [{ text: '🎨 Change Slug Style', callback_data: JSON.stringify({ action: 'settings_style' }) }],
              [{ text: '⚡ Toggle Auto-Confirm', callback_data: JSON.stringify({ action: 'settings_auto_confirm' }) }],
              [{ text: '💭 Toggle Reasoning', callback_data: JSON.stringify({ action: 'settings_reasoning' }) }],
              [{ text: '🔄 Reset to Defaults', callback_data: JSON.stringify({ action: 'settings_reset' }) }],
              [{ text: '❌ Close', callback_data: JSON.stringify({ action: 'settings_close' }) }]
            ]
          }
        });
      } catch (error) {
        console.error('Error showing settings:', error);
        ctx.reply('❌ Error loading settings. Please try again.');
      }
    });

    // Links management command
    bot.command('links', async (ctx) => {
      try {
        await linkManagementHandler.showUserLinks(ctx, 1);
      } catch (error) {
        console.error('Error showing links:', error);
        ctx.reply('❌ Error loading your links. Please try again.');
      }
    });

    // Handle text messages (looking for URLs or edit responses)
    bot.on(message('text'), async (ctx) => {
      try {
        const userId = ctx.from?.id;
        const session = userId ? userSessions.get(userId) : null;

        // Check if user is editing a link slug
        if (session?.editingLinkId) {
          await linkManagementHandler.handleEditSlugMessage(ctx);
        } else {
          // Handle regular URL processing
          await linkHandler.handleMessage(ctx);
        }
      } catch (error) {
        console.error('Error handling message:', error);
        ctx.reply('❌ Sorry, I encountered an error. Please try again.');
      }
    });

    // Handle callback queries (button presses)
    bot.on('callback_query', async (ctx) => {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

      try {
        const callbackData = JSON.parse(ctx.callbackQuery.data);
        const action = callbackData.action;

        // Handle setup callbacks
        if (action.startsWith('setup_')) {
          if (action === 'setup_next') {
            await setupHandler.handleSetupCallback(ctx, callbackData.step);
          } else if (action === 'setup_set_domain') {
            await setupHandler.setDomain(ctx, callbackData.domain);
          } else if (action === 'setup_set_style') {
            await setupHandler.setSlugStyle(ctx, callbackData.style);
          } else if (action === 'setup_set_auto_confirm') {
            await setupHandler.setAutoConfirm(ctx, callbackData.value);
          } else if (action === 'setup_set_reasoning') {
            await setupHandler.setShowReasoning(ctx, callbackData.value);
          } else if (action === 'setup_skip') {
            await setupHandler.skipSetup(ctx);
          } else if (action === 'setup_cancel') {
            await setupHandler.cancelSetup(ctx);
          }
        }
        // Handle settings callbacks
        else if (action.startsWith('settings_')) {
          // TODO: Implement settings handler
          await ctx.answerCbQuery('Settings management coming soon!');
        }
        // Handle link management callbacks
        else if (action.startsWith('link_') || action === 'links_page' || action === 'close_links') {
          if (action === 'links_page') {
            await linkManagementHandler.showUserLinks(ctx, callbackData.page || 1);
          } else if (action === 'link_details') {
            await linkManagementHandler.showLinkDetails(ctx, callbackData.linkId!);
          } else if (action === 'link_edit') {
            await linkManagementHandler.editLink(ctx, callbackData.linkId!);
          } else if (action === 'link_delete') {
            await linkManagementHandler.deleteLink(ctx, callbackData.linkId!);
          } else if (action === 'link_delete_confirm') {
            await linkManagementHandler.confirmDeleteLink(ctx, callbackData.linkId!);
          } else if (action === 'close_links') {
            await ctx.answerCbQuery('Closed');
            await ctx.editMessageText('📄 Link management closed.\n\nUse /links to view your links again.', {
              reply_markup: { inline_keyboard: [] }
            });
          } else {
            await ctx.answerCbQuery('Feature coming soon!');
          }
        }
        // Handle regular link creation callbacks
        else {
          await linkHandler.handleCallbackQuery(ctx);
        }
      } catch (error) {
        console.error('Error handling callback query:', error);
        ctx.answerCbQuery('An error occurred. Please try again.');
      }
    });

    // Handle stickers, photos, etc. with helpful message
    bot.on('message', (ctx) => {
      if (!('text' in ctx.message)) {
        ctx.reply('📎 Please send me a URL as text to create a short link!');
      }
    });

    // Error handling
    bot.catch((err, ctx) => {
      console.error('Bot error:', err);
      
      if (ctx) {
        ctx.reply('❌ An unexpected error occurred. Please try again or contact support.');
      }
    });

    // Configure bot settings with retry logic
    const configureBotSettings = async (retryCount = 0) => {
      try {
        // Set bot commands menu
        await bot.telegram.setMyCommands([
          { command: 'start', description: 'Start or restart the bot' },
          { command: 'help', description: 'Show help and usage instructions' },
          { command: 'about', description: 'About Telepath bot' },
          { command: 'links', description: 'View and manage your short links' },
          { command: 'settings', description: 'Configure your preferences' }
        ]);

        // Set bot name and description (these are often rate-limited)
        await bot.telegram.setMyName('Telepath - AI Short Links');
        await bot.telegram.setMyDescription('🚀 Telepath creates intelligent short links using AI! Simply send any URL and get a meaningful, memorable short link powered by Google Gemini and Dub.sh.\n\n✨ Features:\n• AI-powered slug generation\n• Custom domain support\n• Link analytics & management\n• Personalized preferences\n\nJust send me a URL to get started!');
        await bot.telegram.setMyShortDescription('AI-powered short link generator with intelligent slug creation');

        // Set chat menu button
        await bot.telegram.setChatMenuButton({
          menuButton: {
            type: 'commands'
          }
        });

        console.log('✅ Bot configuration set successfully');
      } catch (error: any) {
        if (error.response?.error_code === 429) {
          const retryAfter = error.response.parameters?.retry_after || 60;
          console.warn(`⚠️ Rate limited. Retrying bot configuration in ${retryAfter} seconds...`);
          
          if (retryCount < 3) {
            setTimeout(() => configureBotSettings(retryCount + 1), retryAfter * 1000);
          } else {
            console.warn('⚠️ Max retries reached. Bot configuration will be skipped.');
          }
        } else {
          console.warn('⚠️ Warning: Could not set bot configuration:', error);
        }
      }
    };

    // Start bot configuration (non-blocking)
    configureBotSettings();

    // Launch bot
    await bot.launch();
    
    // Display bot information
    const botInfo = await bot.telegram.getMe();
    console.log('🤖 Telepath bot is running!');
    console.log(`📋 Bot Username: @${botInfo.username}`);
    console.log(`🆔 Bot ID: ${botInfo.id}`);
    console.log(`👤 Bot Name: ${botInfo.first_name}`);
    console.log('🔗 Ready to create intelligent short links!');
    console.log('📞 Available commands: /start, /help, /about, /links, /settings');

    // Enable graceful stop
    process.once('SIGINT', () => {
      console.log('Received SIGINT, shutting down gracefully...');
      bot.stop('SIGINT');
    });
    
    process.once('SIGTERM', () => {
      console.log('Received SIGTERM, shutting down gracefully...');
      bot.stop('SIGTERM');
    });

  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Start the bot
startBot();