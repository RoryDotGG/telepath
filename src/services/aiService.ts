import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { AIPromptContext, LinkSuggestion, SlugStyle } from '../types';
import { AIServiceError, withRetry } from '../utils/errorHandler';

export class AIService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
  }

  async generateSlug(context: AIPromptContext, slugStyle: SlugStyle = SlugStyle.INTELLIGENT): Promise<LinkSuggestion> {
    try {
      return await withRetry(async () => {
        try {
          const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
          
          const prompt = this.buildPrompt(context, slugStyle);
          const result = await model.generateContent(prompt);
          const response = result.response;
          const text = response.text();

          return this.parseResponse(text, context);
        } catch (error) {
          throw new AIServiceError(`Failed to generate AI slug: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    } catch (error) {
      console.warn('AI generation failed, using fallback:', error);
      // Fallback to simple slug generation
      return this.generateFallbackSlug(context);
    }
  }

  private buildPrompt(context: AIPromptContext, slugStyle: SlugStyle = SlugStyle.INTELLIGENT): string {
    return `
You are an expert at creating short, memorable, and relevant URL slugs for links.

Given the following URL information:
- URL: ${context.url}
- Domain: ${context.domain || 'dub.sh'}
${context.title ? `- Title: ${context.title}` : ''}
${context.description ? `- Description: ${context.description}` : ''}

${this.getSlugStyleInstructions(slugStyle)}

Generate a short, memorable slug that:
1. Is relevant to the content/purpose of the URL
2. Is easy to remember and type
3. Uses only lowercase letters, numbers, and hyphens
4. Avoids generic terms like "link", "url", "click"
5. Is concise but descriptive

Respond in exactly this JSON format:
{
  "slug": "your-suggested-slug",
  "reasoning": "Brief explanation of why this slug is good"
}
`.trim();
  }

  private parseResponse(response: string, context: AIPromptContext): LinkSuggestion {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.slug && parsed.reasoning) {
          return {
            url: context.url,
            suggestedSlug: this.sanitizeSlug(parsed.slug),
            domain: context.domain || 'dub.sh',
            reasoning: parsed.reasoning,
          };
        }
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
    }

    // Fallback if parsing fails
    return this.generateFallbackSlug(context);
  }

  private generateFallbackSlug(context: AIPromptContext): LinkSuggestion {
    const url = new URL(context.url);
    let slug = url.hostname.replace(/^www\./, '').split('.')[0];
    
    // If we have a path, try to extract meaningful part
    if (url.pathname && url.pathname !== '/') {
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart && lastPart.length < 15) {
          slug = lastPart.replace(/[^a-z0-9-]/gi, '').toLowerCase();
        }
      }
    }

    // Ensure slug is not too long
    slug = slug.substring(0, 12);
    
    return {
      url: context.url,
      suggestedSlug: this.sanitizeSlug(slug),
      domain: context.domain || 'dub.sh',
      reasoning: 'Generated from URL domain/path',
    };
  }

  private sanitizeSlug(slug: string): string {
    return slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '')
      .substring(0, 12);
  }

  private getSlugStyleInstructions(slugStyle: SlugStyle): string {
    switch (slugStyle) {
      case SlugStyle.INTELLIGENT:
        return 'Create intelligent, context-aware slugs (4-8 characters) that balance brevity with meaning.';
      case SlugStyle.SHORT:
        return 'PRIORITY: Create very short slugs (3-5 characters) while maintaining relevance. Prefer abbreviations and single words.';
      case SlugStyle.DESCRIPTIVE:
        return 'Create longer, more descriptive slugs (8-15 characters) that clearly explain the content. Readability is more important than brevity.';
      case SlugStyle.TECHNICAL:
        return 'Use technical conventions: kebab-case, abbreviations, and developer-friendly terms. Follow common programming naming patterns.';
      default:
        return 'Create intelligent, balanced slugs that are both meaningful and concise.';
    }
  }
}