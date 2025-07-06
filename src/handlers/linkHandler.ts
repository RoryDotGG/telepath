import { Context } from 'telegraf';
import { Update } from 'telegraf/types';
import { DubService } from '../services/dubService';
import { AIService } from '../services/aiService';
import { UserPreferencesService } from '../services/userPreferencesService';
import { LinkManagementService } from '../services/linkManagementService';
import { extractUrls, isValidUrl, isShortUrl, normalizeUrl, getDomainFromUrl } from '../utils/validators';
import { LinkSuggestion, UserSession, CallbackData, SlugStyle } from '../types';
import { handleError, getUserFriendlyMessage, BotError, ValidationError } from '../utils/errorHandler';

export class LinkHandler {
  private dubService: DubService;
  private aiService: AIService;
  private userPreferences: UserPreferencesService;
  private linkManagement: LinkManagementService;
  private userSessions: Map<number, UserSession>;

  constructor(userSessions: Map<number, UserSession>, userPreferencesService?: UserPreferencesService, linkManagementService?: LinkManagementService) {
    this.dubService = new DubService();
    this.aiService = new AIService();
    this.userPreferences = userPreferencesService || new UserPreferencesService();
    this.linkManagement = linkManagementService || new LinkManagementService();
    this.userSessions = userSessions;
  }

  async handleMessage(ctx: Context<Update.MessageUpdate>) {
    if (!ctx.message || !('text' in ctx.message)) return;

    const text = ctx.message.text;
    const urls = extractUrls(text);

    if (urls.length === 0) return;

    // Process the first URL found
    const url = normalizeUrl(urls[0]);
    
    // Check if it's already a short URL
    if (isShortUrl(url)) {
      throw new ValidationError(
        'Short URL provided',
        '⚠️ This URL appears to already be a short link. Please provide the original long URL.'
      );
    }

    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      // Check if user has completed setup
      const userPrefs = await this.userPreferences.getUserPreferences(userId);
      console.log(`User ${userId} preferences:`, userPrefs);
      
      if (!userPrefs || !userPrefs.setupCompleted) {
        await ctx.reply('⚙️ Please complete setup first using /start to configure your preferences.');
        return;
      }

      await ctx.reply('🔍 Analyzing URL and generating intelligent short link...');
      
      // Generate AI suggestion with user's preferred style
      const suggestion = await this.aiService.generateSlug({
        url,
        domain: userPrefs.defaultDomain || 'dub.sh',
      }, userPrefs.preferredSlugStyle);

      // Get available domains
      const workspaceInfo = await this.dubService.getWorkspaceInfo();
      const availableDomains = workspaceInfo.domains
        .filter(d => d.verified)
        .map(d => d.slug);

      // Store in user session
      this.userSessions.set(userId, {
        pendingLink: suggestion,
        availableDomains,
      });

      // Auto-confirm if user preference is set
      if (userPrefs.autoConfirm) {
        await this.confirmLink(ctx as any, suggestion);
      } else {
        // Send suggestion with inline keyboard
        await this.sendSuggestion(ctx as any, suggestion, availableDomains, userPrefs.showReasoning);
      }
    } catch (error) {
      const botError = handleError(error, 'handleMessage');
      await ctx.reply(`❌ ${getUserFriendlyMessage(botError)}`);
    }
  }

  async handleCallbackQuery(ctx: Context) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

    const userId = ctx.from?.id;
    if (!userId) return;

    const session = this.userSessions.get(userId);
    if (!session?.pendingLink) {
      await ctx.answerCbQuery('Session expired. Please send a new URL.');
      return;
    }

    try {
      const callbackData: CallbackData = JSON.parse(ctx.callbackQuery.data);
      
      switch (callbackData.action) {
        case 'confirm':
          await this.confirmLink(ctx, session.pendingLink);
          break;
        case 'edit':
          await this.promptForEdit(ctx);
          break;
        case 'reject':
          await this.rejectLink(ctx);
          break;
        case 'select_domain':
          await this.selectDomain(ctx, callbackData.data || 'dub.sh');
          break;
      }
    } catch (error) {
      console.error('Error handling callback:', error);
      await ctx.answerCbQuery('An error occurred. Please try again.');
    }
  }

  async handleEditMessage(ctx: Context) {
    if (!ctx.message || !('text' in ctx.message)) return;

    const userId = ctx.from?.id;
    if (!userId) return;

    const session = this.userSessions.get(userId);
    if (!session?.pendingLink) return;

    const customSlug = ctx.message.text.trim();
    
    try {
      // Update the suggestion with custom slug
      session.pendingLink.suggestedSlug = customSlug;
      session.pendingLink.reasoning = 'Custom slug provided by user';

      await ctx.reply('✏️ Custom slug updated! Please confirm:');
      await this.sendSuggestion(ctx, session.pendingLink, session.availableDomains || []);
    } catch (error) {
      console.error('Error updating custom slug:', error);
      await ctx.reply('❌ Error updating slug. Please try again.');
    }
  }

  private async sendSuggestion(ctx: Context, suggestion: LinkSuggestion, availableDomains: string[], showReasoning: boolean = true) {
    const domain = getDomainFromUrl(suggestion.url);
    const shortLink = `${suggestion.domain}/${suggestion.suggestedSlug}`;

    let message = `🔗 **Smart Link Generated**

**📝 Original URL:**
${suggestion.url}

**🎯 Suggested Short Link:**
${shortLink}`;

    if (showReasoning) {
      message += `

**🧠 AI Reasoning:**
${suggestion.reasoning}`;
    }

    message += `

**🌐 Source Domain:** ${domain}

Choose an action:`;

    const keyboard = [
      [
        { text: '✅ Create Link', callback_data: JSON.stringify({ action: 'confirm' }) },
        { text: '✏️ Edit Slug', callback_data: JSON.stringify({ action: 'edit' }) },
      ],
      [
        { text: '❌ Cancel', callback_data: JSON.stringify({ action: 'reject' }) },
      ],
    ];

    // Add domain selection if multiple domains available
    if (availableDomains.length > 1) {
      const domainButtons = availableDomains.slice(0, 2).map(domain => ({
        text: `🌐 Use ${domain}`,
        callback_data: JSON.stringify({ action: 'select_domain', data: domain }),
      }));
      
      if (domainButtons.length > 0) {
        keyboard.push(domainButtons);
      }
    }

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  }

  private async confirmLink(ctx: Context, suggestion: LinkSuggestion) {
    try {
      await ctx.answerCbQuery('Creating short link...');

      const userId = ctx.from?.id;
      if (!userId) return;

      const result = await this.dubService.createLink({
        url: suggestion.url,
        domain: suggestion.domain,
        key: suggestion.suggestedSlug,
      });

      // Save link to user's collection
      await this.linkManagement.saveLink(userId, {
        id: result.id,
        domain: result.domain,
        key: result.key,
        url: result.url,
        shortLink: result.shortLink,
      });

      const message = `✅ **Short Link Created!**

🔗 **Your Short Link:**
${result.shortLink}

📝 **Original URL:**
${result.url}

📊 **Link ID:** \`${result.id}\`

You can now share this link anywhere! 🚀

💡 Use /links to manage all your created links.`;

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [] },
      });

      // Clear session
      if (userId) {
        this.userSessions.delete(userId);
      }
    } catch (error) {
      const botError = handleError(error, 'confirmLink');
      await ctx.answerCbQuery('Error creating link. Please try again.');
      await ctx.reply(`❌ ${getUserFriendlyMessage(botError)}`);
    }
  }

  private async promptForEdit(ctx: Context) {
    await ctx.answerCbQuery('Send me your custom slug');
    await ctx.reply('✏️ Please send me your custom slug (letters, numbers, and hyphens only):');
  }

  private async rejectLink(ctx: Context) {
    await ctx.answerCbQuery('Cancelled');
    await ctx.editMessageText('❌ **Link creation cancelled**\n\nSend me another URL when you\'re ready!', {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [] },
    });

    // Clear session
    const userIdForSession = ctx.from?.id;
    if (userIdForSession) {
      this.userSessions.delete(userIdForSession);
    }
  }

  private async selectDomain(ctx: Context, domain: string) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const session = this.userSessions.get(userId);
    if (!session?.pendingLink) return;

    // Update domain in session
    session.pendingLink.domain = domain;
    
    await ctx.answerCbQuery(`Domain changed to ${domain}`);
    await this.sendSuggestion(ctx, session.pendingLink, session.availableDomains || []);
  }
}