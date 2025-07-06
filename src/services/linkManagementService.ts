import { UserLink } from '../types';
import { prisma } from '../lib/database';

export class LinkManagementService {

  async saveLink(userId: number, link: Omit<UserLink, 'userId' | 'createdAt' | 'updatedAt'>): Promise<UserLink> {
    const created = await prisma.userLink.create({
      data: {
        id: link.id,
        userId,
        domain: link.domain,
        key: link.key,
        url: link.url,
        shortLink: link.shortLink,
        title: link.title,
        description: link.description,
        clicks: link.clicks || 0,
      }
    });

    return {
      id: created.id,
      userId: created.userId,
      domain: created.domain,
      key: created.key,
      url: created.url,
      shortLink: created.shortLink,
      title: created.title || undefined,
      description: created.description || undefined,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt || undefined,
      clicks: created.clicks,
    };
  }

  async getUserLinks(userId: number, page: number = 1, pageSize: number = 5): Promise<{
    links: UserLink[];
    totalPages: number;
    totalLinks: number;
    currentPage: number;
  }> {
    const totalLinks = await prisma.userLink.count({
      where: { userId }
    });
    
    const links = await prisma.userLink.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    
    const totalPages = Math.ceil(totalLinks / pageSize);

    return {
      links: links.map(link => ({
        id: link.id,
        userId: link.userId,
        domain: link.domain,
        key: link.key,
        url: link.url,
        shortLink: link.shortLink,
        title: link.title || undefined,
        description: link.description || undefined,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt || undefined,
        clicks: link.clicks,
      })),
      totalPages,
      totalLinks,
      currentPage: page,
    };
  }

  async getLinkById(userId: number, linkId: string): Promise<UserLink | null> {
    const link = await prisma.userLink.findFirst({
      where: {
        id: linkId,
        userId
      }
    });
    
    if (!link) return null;
    
    return {
      id: link.id,
      userId: link.userId,
      domain: link.domain,
      key: link.key,
      url: link.url,
      shortLink: link.shortLink,
      title: link.title || undefined,
      description: link.description || undefined,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt || undefined,
      clicks: link.clicks,
    };
  }

  async updateLink(userId: number, linkId: string, updates: Partial<UserLink>): Promise<UserLink | null> {
    try {
      const updated = await prisma.userLink.update({
        where: {
          id: linkId,
          userId
        },
        data: {
          domain: updates.domain,
          key: updates.key,
          url: updates.url,
          shortLink: updates.shortLink,
          title: updates.title,
          description: updates.description,
          clicks: updates.clicks,
        }
      });
      
      return {
        id: updated.id,
        userId: updated.userId,
        domain: updated.domain,
        key: updated.key,
        url: updated.url,
        shortLink: updated.shortLink,
        title: updated.title || undefined,
        description: updated.description || undefined,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt || undefined,
        clicks: updated.clicks,
      };
    } catch (error) {
      return null;
    }
  }

  async deleteLink(userId: number, linkId: string): Promise<boolean> {
    try {
      await prisma.userLink.delete({
        where: {
          id: linkId,
          userId
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async incrementClickCount(userId: number, linkId: string): Promise<void> {
    try {
      await prisma.userLink.update({
        where: {
          id: linkId,
          userId
        },
        data: {
          clicks: {
            increment: 1
          }
        }
      });
    } catch (error) {
      // Ignore if link not found
    }
  }

  async searchUserLinks(userId: number, query: string): Promise<UserLink[]> {
    const links = await prisma.userLink.findMany({
      where: {
        userId,
        OR: [
          { url: { contains: query } },
          { key: { contains: query } },
          { title: { contains: query } },
          { description: { contains: query } },
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return links.map(link => ({
      id: link.id,
      userId: link.userId,
      domain: link.domain,
      key: link.key,
      url: link.url,
      shortLink: link.shortLink,
      title: link.title || undefined,
      description: link.description || undefined,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt || undefined,
      clicks: link.clicks,
    }));
  }

  async getUserLinkStats(userId: number): Promise<{
    totalLinks: number;
    totalClicks: number;
    mostClickedLink?: UserLink;
    recentLinks: UserLink[];
  }> {
    const totalLinks = await prisma.userLink.count({
      where: { userId }
    });
    
    const clicksResult = await prisma.userLink.aggregate({
      where: { userId },
      _sum: {
        clicks: true
      }
    });
    
    const mostClickedLink = await prisma.userLink.findFirst({
      where: { userId },
      orderBy: { clicks: 'desc' }
    });
    
    const recentLinks = await prisma.userLink.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    return {
      totalLinks,
      totalClicks: clicksResult._sum.clicks || 0,
      mostClickedLink: mostClickedLink ? {
        id: mostClickedLink.id,
        userId: mostClickedLink.userId,
        domain: mostClickedLink.domain,
        key: mostClickedLink.key,
        url: mostClickedLink.url,
        shortLink: mostClickedLink.shortLink,
        title: mostClickedLink.title || undefined,
        description: mostClickedLink.description || undefined,
        createdAt: mostClickedLink.createdAt,
        updatedAt: mostClickedLink.updatedAt || undefined,
        clicks: mostClickedLink.clicks,
      } : undefined,
      recentLinks: recentLinks.map(link => ({
        id: link.id,
        userId: link.userId,
        domain: link.domain,
        key: link.key,
        url: link.url,
        shortLink: link.shortLink,
        title: link.title || undefined,
        description: link.description || undefined,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt || undefined,
        clicks: link.clicks,
      })),
    };
  }
}