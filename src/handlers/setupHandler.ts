import { Context } from 'telegraf';
import { UserPreferencesService } from '../services/userPreferencesService';
import { DubService } from '../services/dubService';
import { SetupStep, SlugStyle, UserSession } from '../types';
import { handleError, getUserFriendlyMessage } from '../utils/errorHandler';

export class SetupHandler {
  private userPreferences: UserPreferencesService;
  private dubService: DubService;
  private userSessions: Map<number, UserSession>;

  constructor(userSessions: Map<number, UserSession>) {
    this.userPreferences = new UserPreferencesService();
    this.dubService = new DubService();
    this.userSessions = userSessions;
  }

  async startSetup(ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    try {
      // Create default preferences
      await this.userPreferences.createDefaultPreferences(userId);
      
      // Set session setup step
      const session = this.userSessions.get(userId) || {};
      session.setupStep = SetupStep.WELCOME;
      this.userSessions.set(userId, session);

      const welcomeMessage = `🚀 **Welcome to Telepath Setup!**

Let's configure your preferences for the best short link experience.

This will only take a minute and you can change these settings anytime with /settings.

**What we'll set up:**
• 🌐 Default domain preference
• 🎨 Slug generation style
• ⚡ Auto-confirmation settings
• 💭 Display preferences

Ready to get started?`;

      await ctx.reply(welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '▶️ Start Setup', callback_data: JSON.stringify({ action: 'setup_next', step: SetupStep.DOMAIN_SELECTION }) },
              { text: '⏭️ Skip Setup', callback_data: JSON.stringify({ action: 'setup_skip' }) }
            ]
          ]
        }
      });
    } catch (error) {
      const botError = handleError(error, 'startSetup');
      await ctx.reply(`❌ ${getUserFriendlyMessage(botError)}`);
    }
  }

  async handleSetupCallback(ctx: Context, step: SetupStep): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    try {
      switch (step) {
        case SetupStep.DOMAIN_SELECTION:
          await this.showDomainSelection(ctx);
          break;
        case SetupStep.SLUG_STYLE:
          await this.showSlugStyleSelection(ctx);
          break;
        case SetupStep.AUTO_CONFIRM:
          await this.showAutoConfirmSelection(ctx);
          break;
        case SetupStep.SHOW_REASONING:
          await this.showReasoningSelection(ctx);
          break;
        case SetupStep.COMPLETED:
          await this.completeSetup(ctx);
          break;
      }
    } catch (error) {
      const botError = handleError(error, 'handleSetupCallback');
      await ctx.reply(`❌ ${getUserFriendlyMessage(botError)}`);
    }
  }

  private async showDomainSelection(ctx: Context): Promise<void> {
    const userId = ctx.from?.id!;
    
    // Update session step
    const session = this.userSessions.get(userId) || {};
    session.setupStep = SetupStep.DOMAIN_SELECTION;
    this.userSessions.set(userId, session);

    // Get available domains
    const workspaceInfo = await this.dubService.getWorkspaceInfo();
    const domains = workspaceInfo.domains.filter(d => d.verified);

    const message = `🌐 **Choose Your Default Domain**

This will be your preferred domain for creating short links. You can always change this later or select a different domain when creating links.

**Available domains:**`;

    const keyboard = [];

    // Add dub.sh as default option
    keyboard.push([
      { text: '🔗 dub.sh (Default)', callback_data: JSON.stringify({ action: 'setup_set_domain', domain: 'dub.sh' }) }
    ]);

    // Add custom domains
    for (const domain of domains.slice(0, 8)) { // Limit to 8 domains to avoid keyboard overflow
      keyboard.push([
        { text: `🌐 ${domain.slug}${domain.primary ? ' (Primary)' : ''}`, 
          callback_data: JSON.stringify({ action: 'setup_set_domain', domain: domain.slug }) }
      ]);
    }

    // Navigation
    keyboard.push([
      { text: '⏭️ Skip', callback_data: JSON.stringify({ action: 'setup_next', step: SetupStep.SLUG_STYLE }) },
      { text: '❌ Cancel Setup', callback_data: JSON.stringify({ action: 'setup_cancel' }) }
    ]);

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private async showSlugStyleSelection(ctx: Context): Promise<void> {
    const message = `🎨 **Choose Your Slug Style**

How would you like the AI to generate your short link slugs?`;

    const keyboard = [
      [{ text: '🧠 Intelligent (Recommended)', callback_data: JSON.stringify({ action: 'setup_set_style', style: SlugStyle.INTELLIGENT }) }],
      [{ text: '⚡ Short & Sweet', callback_data: JSON.stringify({ action: 'setup_set_style', style: SlugStyle.SHORT }) }],
      [{ text: '📝 Descriptive', callback_data: JSON.stringify({ action: 'setup_set_style', style: SlugStyle.DESCRIPTIVE }) }],
      [{ text: '🔧 Technical', callback_data: JSON.stringify({ action: 'setup_set_style', style: SlugStyle.TECHNICAL }) }],
      [
        { text: '⬅️ Back', callback_data: JSON.stringify({ action: 'setup_next', step: SetupStep.DOMAIN_SELECTION }) },
        { text: '⏭️ Skip', callback_data: JSON.stringify({ action: 'setup_next', step: SetupStep.AUTO_CONFIRM }) }
      ]
    ];

    // Add descriptions
    const descriptions = Object.values(SlugStyle).map(style => 
      `• **${style}**: ${this.userPreferences.getSlugStyleDescription(style)}`
    ).join('\n');

    await ctx.editMessageText(`${message}\n\n${descriptions}`, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private async showAutoConfirmSelection(ctx: Context): Promise<void> {
    const message = `⚡ **Auto-Confirmation**

Would you like to automatically confirm AI suggestions, or review them first?

• **Review First**: See suggestions with Confirm/Edit/Reject buttons
• **Auto-Confirm**: Automatically create links with AI suggestions`;

    const keyboard = [
      [{ text: '🤔 Review First (Recommended)', callback_data: JSON.stringify({ action: 'setup_set_auto_confirm', value: false }) }],
      [{ text: '⚡ Auto-Confirm', callback_data: JSON.stringify({ action: 'setup_set_auto_confirm', value: true }) }],
      [
        { text: '⬅️ Back', callback_data: JSON.stringify({ action: 'setup_next', step: SetupStep.SLUG_STYLE }) },
        { text: '⏭️ Skip', callback_data: JSON.stringify({ action: 'setup_next', step: SetupStep.SHOW_REASONING }) }
      ]
    ];

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private async showReasoningSelection(ctx: Context): Promise<void> {
    const message = `💭 **AI Reasoning Display**

Would you like to see the AI's reasoning for each slug suggestion?

• **Show Reasoning**: See why the AI chose each slug
• **Hide Reasoning**: Just see the suggested slug`;

    const keyboard = [
      [{ text: '💭 Show Reasoning (Recommended)', callback_data: JSON.stringify({ action: 'setup_set_reasoning', value: true }) }],
      [{ text: '🎯 Hide Reasoning', callback_data: JSON.stringify({ action: 'setup_set_reasoning', value: false }) }],
      [
        { text: '⬅️ Back', callback_data: JSON.stringify({ action: 'setup_next', step: SetupStep.AUTO_CONFIRM }) },
        { text: '✅ Finish Setup', callback_data: JSON.stringify({ action: 'setup_next', step: SetupStep.COMPLETED }) }
      ]
    ];

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private async completeSetup(ctx: Context): Promise<void> {
    const userId = ctx.from?.id!;
    
    // Mark setup as completed
    await this.userPreferences.markSetupCompleted(userId);
    console.log(`Setup completed for user ${userId}`);
    
    // Clear session
    this.userSessions.delete(userId);

    // Get final preferences
    const preferences = await this.userPreferences.getUserPreferences(userId);

    const message = `🎉 **Setup Complete!**

Your Telepath is now configured and ready to create intelligent short links!

**Your Settings:**
🌐 **Default Domain:** ${preferences?.defaultDomain || 'dub.sh'}
🎨 **Slug Style:** ${preferences?.preferredSlugStyle || SlugStyle.INTELLIGENT}
⚡ **Auto-Confirm:** ${preferences?.autoConfirm ? 'Yes' : 'No'}
💭 **Show Reasoning:** ${preferences?.showReasoning ? 'Yes' : 'No'}

**Ready to try it?** Send me any URL to create your first smart short link!

You can change these settings anytime with /settings.`;

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [] }
    });
  }

  async setDomain(ctx: Context, domain: string): Promise<void> {
    const userId = ctx.from?.id!;
    await this.userPreferences.updatePreferences(userId, { defaultDomain: domain });
    await this.handleSetupCallback(ctx, SetupStep.SLUG_STYLE);
  }

  async setSlugStyle(ctx: Context, style: SlugStyle): Promise<void> {
    const userId = ctx.from?.id!;
    await this.userPreferences.updatePreferences(userId, { preferredSlugStyle: style });
    await this.handleSetupCallback(ctx, SetupStep.AUTO_CONFIRM);
  }

  async setAutoConfirm(ctx: Context, value: boolean): Promise<void> {
    const userId = ctx.from?.id!;
    await this.userPreferences.updatePreferences(userId, { autoConfirm: value });
    await this.handleSetupCallback(ctx, SetupStep.SHOW_REASONING);
  }

  async setShowReasoning(ctx: Context, value: boolean): Promise<void> {
    const userId = ctx.from?.id!;
    await this.userPreferences.updatePreferences(userId, { showReasoning: value });
    await this.handleSetupCallback(ctx, SetupStep.COMPLETED);
  }

  async skipSetup(ctx: Context): Promise<void> {
    const userId = ctx.from?.id!;
    
    // Mark setup as completed with defaults
    await this.userPreferences.markSetupCompleted(userId);
    console.log(`Setup skipped for user ${userId}`);
    
    // Clear session
    this.userSessions.delete(userId);

    const message = `⏭️ **Setup Skipped**

You can configure your preferences anytime with /settings.

**Default Settings Applied:**
🌐 **Domain:** dub.sh
🎨 **Style:** Intelligent AI generation
⚡ **Confirmation:** Review suggestions first
💭 **Reasoning:** Show AI explanations

Send me a URL to create your first short link!`;

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [] }
    });
  }

  async cancelSetup(ctx: Context): Promise<void> {
    const userId = ctx.from?.id!;
    
    // Clear session but don't mark setup as completed
    this.userSessions.delete(userId);

    await ctx.editMessageText('❌ Setup cancelled. You can start setup again with /start.', {
      reply_markup: { inline_keyboard: [] }
    });
  }

  getUserPreferencesService(): UserPreferencesService {
    return this.userPreferences;
  }
}