import { config } from '../config';

export class AuthService {
  private allowedUserIds: Set<number>;

  constructor() {
    this.allowedUserIds = new Set();
    this.loadAllowedUsers();
  }

  private loadAllowedUsers(): void {
    const allowedUsers = process.env.ALLOWED_USER_IDS;
    
    if (!allowedUsers) {
      console.warn('⚠️ ALLOWED_USER_IDS not set. Bot will be accessible to all users.');
      return;
    }

    try {
      const userIds = allowedUsers.split(',').map(id => parseInt(id.trim(), 10));
      
      for (const userId of userIds) {
        if (isNaN(userId)) {
          console.warn(`⚠️ Invalid user ID in ALLOWED_USER_IDS: ${userId}`);
          continue;
        }
        this.allowedUserIds.add(userId);
      }

      console.log(`✅ Loaded ${this.allowedUserIds.size} allowed user(s)`);
    } catch (error) {
      console.error('❌ Error parsing ALLOWED_USER_IDS:', error);
    }
  }

  public isUserAllowed(userId: number): boolean {
    // If no allowed users are configured, allow all users
    if (this.allowedUserIds.size === 0) {
      return true;
    }

    return this.allowedUserIds.has(userId);
  }

  public getUnauthorizedMessage(): string {
    return `🚫 **Access Denied**

Sorry, you don't have permission to use this bot. 

This bot is currently restricted to authorized users only. If you believe you should have access, please contact the bot administrator.`;
  }

  public getAllowedUsersCount(): number {
    return this.allowedUserIds.size;
  }

  public addUser(userId: number): void {
    this.allowedUserIds.add(userId);
    console.log(`✅ Added user ${userId} to allowed list`);
  }

  public removeUser(userId: number): boolean {
    const removed = this.allowedUserIds.delete(userId);
    if (removed) {
      console.log(`✅ Removed user ${userId} from allowed list`);
    }
    return removed;
  }

  public listAllowedUsers(): number[] {
    return Array.from(this.allowedUserIds);
  }
}