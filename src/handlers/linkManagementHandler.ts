import { Context } from 'telegraf';
import { LinkManagementService } from '../services/linkManagementService';
import { DubService } from '../services/dubService';
import { UserLink, CallbackData, LinkManagementSession, UserSession } from '../types';
import { handleError, getUserFriendlyMessage } from '../utils/errorHandler';

export class LinkManagementHandler {
  private linkManagement: LinkManagementService;
  private dubService: DubService;
  private userSessions: Map<number, UserSession>;
  private linkIdMap: Map<string, string> = new Map(); // Short ID -> Full ID mapping

  constructor(linkManagementService: LinkManagementService, userSessions: Map<number, UserSession>) {
    this.linkManagement = linkManagementService;
    this.dubService = new DubService();
    this.userSessions = userSessions;
  }

  async showUserLinks(ctx: Context, page: number = 1): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    try {
      const result = await this.linkManagement.getUserLinks(userId, page);
      
      if (result.totalLinks === 0) {
        await ctx.reply(`📄 **Your Short Links**

You haven't created any short links yet!

Send me a URL to create your first smart short link. 🚀`, {
          parse_mode: 'Markdown'
        });
        return;
      }

      let message = `📄 **Your Short Links** (Page ${result.currentPage}/${result.totalPages})
📊 **Total:** ${result.totalLinks} links

`;

      result.links.forEach((link, index) => {
        const number = (result.currentPage - 1) * 5 + index + 1;
        const clickText = link.clicks ? ` • ${link.clicks} clicks` : '';
        const date = link.createdAt.toLocaleDateString();
        
        message += `**${number}.** ${link.shortLink}
📝 ${this.truncateUrl(link.url, 50)}
📅 ${date}${clickText}

`;
      });

      const keyboard = this.buildLinksKeyboard(result.links, result.currentPage, result.totalPages);
      
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
    } catch (error) {
      const botError = handleError(error, 'showUserLinks');
      await ctx.reply(`❌ ${getUserFriendlyMessage(botError)}`);
    }
  }

  async showLinkDetails(ctx: Context, linkId: string): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    try {
      // Resolve short ID to full ID
      const fullLinkId = this.resolveShortId(linkId) || linkId;
      const link = await this.linkManagement.getLinkById(userId, fullLinkId);
      if (!link) {
        await ctx.answerCbQuery('Link not found');
        return;
      }

      const message = `🔗 **Link Details**

**Short Link:**
${link.shortLink}

**Original URL:**
${link.url}

**Slug:** ${link.key}
**Domain:** ${link.domain}
**Created:** ${link.createdAt.toLocaleString()}
**Clicks:** ${link.clicks || 0}
${link.updatedAt ? `**Last Updated:** ${link.updatedAt.toLocaleString()}` : ''}

What would you like to do?`;

      const keyboard = [
        [
          { text: '✏️ Edit Slug', callback_data: JSON.stringify({ action: 'link_edit', linkId }) },
          { text: '🗑️ Delete', callback_data: JSON.stringify({ action: 'link_delete', linkId }) }
        ],
        [
          { text: '📋 Copy Link', callback_data: JSON.stringify({ action: 'link_copy', linkId }) },
          { text: '📊 Analytics', callback_data: JSON.stringify({ action: 'link_analytics', linkId }) }
        ],
        [
          { text: '⬅️ Back to List', callback_data: JSON.stringify({ action: 'links_page', page: 1 }) }
        ]
      ];

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
    } catch (error) {
      const botError = handleError(error, 'showLinkDetails');
      await ctx.answerCbQuery(`Error: ${getUserFriendlyMessage(botError)}`);
    }
  }

  async editLink(ctx: Context, linkId: string): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    try {
      // Resolve short ID to full ID
      const fullLinkId = this.resolveShortId(linkId) || linkId;
      const link = await this.linkManagement.getLinkById(userId, fullLinkId);
      if (!link) {
        await ctx.answerCbQuery('Link not found');
        return;
      }

      const message = `✏️ **Edit Link Slug**

**Current Short Link:**
${link.shortLink}

**Current Slug:** ${link.key}

Please send me the new slug you'd like to use:
• Use only letters, numbers, and hyphens
• Keep it short and memorable
• Type 'cancel' to abort`;

      // Store editing session
      const session = this.userSessions.get(userId) || {};
      session.editingLinkId = fullLinkId;
      this.userSessions.set(userId, session);

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❌ Cancel', callback_data: JSON.stringify({ action: 'link_details', linkId }) }]
          ]
        }
      });
    } catch (error) {
      const botError = handleError(error, 'editLink');
      await ctx.answerCbQuery(`Error: ${getUserFriendlyMessage(botError)}`);
    }
  }

  async deleteLink(ctx: Context, linkId: string): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    try {
      // Resolve short ID to full ID
      const fullLinkId = this.resolveShortId(linkId) || linkId;
      const link = await this.linkManagement.getLinkById(userId, fullLinkId);
      if (!link) {
        await ctx.answerCbQuery('Link not found');
        return;
      }

      const message = `🗑️ **Delete Link**

Are you sure you want to delete this link?

**Short Link:**
${link.shortLink}

**Original URL:**
${this.truncateUrl(link.url, 60)}

⚠️ **This action cannot be undone!**`;

      const keyboard = [
        [
          { text: '🗑️ Yes, Delete', callback_data: JSON.stringify({ action: 'link_delete_confirm', linkId }) },
          { text: '❌ Cancel', callback_data: JSON.stringify({ action: 'link_details', linkId }) }
        ]
      ];

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
    } catch (error) {
      const botError = handleError(error, 'deleteLink');
      await ctx.answerCbQuery(`Error: ${getUserFriendlyMessage(botError)}`);
    }
  }

  async confirmDeleteLink(ctx: Context, linkId: string): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    try {
      // Resolve short ID to full ID
      const fullLinkId = this.resolveShortId(linkId) || linkId;
      const link = await this.linkManagement.getLinkById(userId, fullLinkId);
      if (!link) {
        await ctx.answerCbQuery('Link not found');
        return;
      }

      // Delete from Dub
      try {
        await this.dubService.deleteLink(link.id);
      } catch (error) {
        console.warn('Failed to delete from Dub:', error);
      }

      // Delete from local storage
      const deleted = await this.linkManagement.deleteLink(userId, fullLinkId);
      
      if (deleted) {
        await ctx.answerCbQuery('Link deleted successfully');
        await ctx.editMessageText(`✅ **Link Deleted**

The link has been successfully deleted:
\`${link.shortLink}\`

This link will no longer work.`, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📄 Back to Links', callback_data: JSON.stringify({ action: 'links_page', page: 1 }) }]
            ]
          }
        });
      } else {
        await ctx.answerCbQuery('Failed to delete link');
      }
    } catch (error) {
      const botError = handleError(error, 'confirmDeleteLink');
      await ctx.answerCbQuery(`Error: ${getUserFriendlyMessage(botError)}`);
    }
  }

  async handleEditSlugMessage(ctx: Context): Promise<void> {
    if (!ctx.message || !('text' in ctx.message)) return;

    const userId = ctx.from?.id;
    if (!userId) return;

    const session = this.userSessions.get(userId);
    const linkId = session?.editingLinkId;
    
    if (!linkId) return;

    const newSlug = ctx.message.text.trim();

    if (newSlug.toLowerCase() === 'cancel') {
      delete session!.editingLinkId;
      await ctx.reply('✏️ Edit cancelled.');
      return;
    }

    try {
      const link = await this.linkManagement.getLinkById(userId, linkId);
      if (!link) {
        await ctx.reply('❌ Link not found.');
        return;
      }

      // Validate slug
      if (!/^[a-zA-Z0-9-_]+$/.test(newSlug) || newSlug.length > 50) {
        await ctx.reply('❌ Invalid slug. Use only letters, numbers, hyphens, and underscores (max 50 characters).');
        return;
      }

      // Update in Dub (you'd need to implement this)
      try {
        const newShortLink = `${link.domain}/${newSlug}`;
        
        // Update local storage
        await this.linkManagement.updateLink(userId, linkId, {
          key: newSlug,
          shortLink: newShortLink
        });

        delete session!.editingLinkId;

        await ctx.reply(`✅ **Link Updated Successfully!**

**Old Link:** \`${link.shortLink}\`
**New Link:** \`${newShortLink}\`

Your new short link is ready to use! 🚀`, {
          parse_mode: 'Markdown'
        });
      } catch (error) {
        await ctx.reply('❌ Failed to update link. The slug might already be taken.');
      }
    } catch (error) {
      const botError = handleError(error, 'handleEditSlugMessage');
      await ctx.reply(`❌ ${getUserFriendlyMessage(botError)}`);
    }
  }

  private buildLinksKeyboard(links: UserLink[], currentPage: number, totalPages: number): any[][] {
    const keyboard: any[][] = [];

    // Link action buttons (2 per row)
    for (let i = 0; i < links.length; i += 2) {
      const row = [];
      const link1 = links[i];
      const link2 = links[i + 1];

      // Create short IDs for callback data
      const shortId1 = this.generateShortId(link1.id);
      this.linkIdMap.set(shortId1, link1.id);

      row.push({
        text: `🔗 ${link1.key}`,
        callback_data: JSON.stringify({ action: 'link_details', linkId: shortId1 })
      });

      if (link2) {
        const shortId2 = this.generateShortId(link2.id);
        this.linkIdMap.set(shortId2, link2.id);
        
        row.push({
          text: `🔗 ${link2.key}`,
          callback_data: JSON.stringify({ action: 'link_details', linkId: shortId2 })
        });
      }

      keyboard.push(row);
    }

    // Pagination buttons
    if (totalPages > 1) {
      const paginationRow = [];
      
      if (currentPage > 1) {
        paginationRow.push({
          text: '⬅️ Previous',
          callback_data: JSON.stringify({ action: 'links_page', page: currentPage - 1 })
        });
      }

      if (currentPage < totalPages) {
        paginationRow.push({
          text: 'Next ➡️',
          callback_data: JSON.stringify({ action: 'links_page', page: currentPage + 1 })
        });
      }

      if (paginationRow.length > 0) {
        keyboard.push(paginationRow);
      }
    }

    // Action buttons
    keyboard.push([
      { text: '🔄 Refresh', callback_data: JSON.stringify({ action: 'links_page', page: currentPage }) },
      { text: '❌ Close', callback_data: JSON.stringify({ action: 'close_links' }) }
    ]);

    return keyboard;
  }

  private truncateUrl(url: string, maxLength: number): string {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + '...';
  }

  private generateShortId(fullId: string): string {
    // Generate a short ID that's safe for callback data
    const hash = fullId.split('_').pop() || fullId;
    return hash.substring(0, 8);
  }

  private resolveShortId(shortId: string): string | undefined {
    return this.linkIdMap.get(shortId);
  }
}