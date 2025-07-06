import { Dub } from 'dub';
import { config } from '../config';
import { CreateLinkRequest, CreateLinkResponse, DubDomain } from '../types';
import { DubAPIError, withRetry } from '../utils/errorHandler';

export class DubService {
  private dub: Dub;

  constructor() {
    this.dub = new Dub({
      token: config.dubApiKey,
    });
  }

  async createLink(request: CreateLinkRequest): Promise<CreateLinkResponse> {
    return withRetry(async () => {
      try {
        const response = await this.dub.links.create({
          url: request.url,
          domain: request.domain,
          key: request.key,
          title: request.title,
          description: request.description,
        });

        return {
          id: response.id,
          domain: response.domain,
          key: response.key,
          url: response.url,
          shortLink: response.shortLink,
          createdAt: response.createdAt,
        };
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('already exists')) {
            throw new DubAPIError('This slug already exists. Please choose a different one.', 409);
          }
          if (error.message.includes('invalid')) {
            throw new DubAPIError('Invalid slug format. Please use only letters, numbers, and hyphens.', 400);
          }
        }
        throw new DubAPIError(`Failed to create short link: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  async getDomains(): Promise<DubDomain[]> {
    return withRetry(async () => {
      try {
        const response = await this.dub.domains.list();
        const domains: DubDomain[] = [];
        
        for await (const page of response) {
          for (const domain of page.result) {
            domains.push({
              id: domain.id,
              slug: domain.slug,
              verified: domain.verified ?? false,
              primary: domain.primary ?? false,
            });
          }
        }
        
        return domains;
      } catch (error) {
        throw new DubAPIError(`Failed to fetch domains: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  async deleteLink(linkId: string): Promise<void> {
    return withRetry(async () => {
      try {
        await this.dub.links.delete(linkId);
      } catch (error) {
        throw new DubAPIError(`Failed to delete link: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  async getWorkspaceInfo(): Promise<{ domains: DubDomain[] }> {
    try {
      const domains = await this.getDomains();
      return { domains };
    } catch (error) {
      console.error('Error fetching workspace info:', error);
      return { domains: [] };
    }
  }
}