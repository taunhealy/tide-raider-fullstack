// Simple in-memory storage implementation
class MemoryStore {
    private users: Map<string, any> = new Map();
    private sessions: Map<string, any> = new Map();
    private surfConditions: Map<string, any> = new Map();
    private subscriptions: Map<string, any> = new Map();
  
    // User methods
    async createUser(data: any) {
      const id = Math.random().toString(36).substring(7);
      this.users.set(id, { ...data, id });
      return this.users.get(id);
    }
  
    async getUser(id: string) {
      return this.users.get(id) || null;
    }
  
    async getUserByEmail(email: string) {
      return Array.from(this.users.values()).find(user => user.email === email) || null;
    }
  
    // Session methods
    async createSession(data: any) {
      this.sessions.set(data.sessionToken, data);
      return data;
    }
  
    async getSessionAndUser(sessionToken: string) {
      const session = this.sessions.get(sessionToken);
      if (!session) return null;
      const user = await this.getUser(session.userId);
      return { session, user };
    }
  }
  
  export const memoryStore = new MemoryStore();