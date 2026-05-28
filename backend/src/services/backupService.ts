import * as fs from "fs";
import * as path from "path";

// Keep backup paths in the scratch folder as requested
const LOG_BACKUP_PATH = path.join(__dirname, "../../scratch/backup_log_entries.json");
const USER_BACKUP_PATH = path.join(__dirname, "../../scratch/backup_users.json");

export class BackupService {
  // Simple queues to prevent concurrent read-modify-write conflicts
  private static isWritingLogs = false;
  private static isWritingUsers = false;
  private static logQueue: any[] = [];
  private static userQueue: any[] = [];

  /**
   * Back up a user by fetching their full fresh record and enqueuing the JSON backup write
   */
  static async backupUser(userId: string, prismaClient: any) {
    try {
      const user = await prismaClient.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        console.warn(`[BackupService] User ${userId} not found in DB, skipping backup.`);
        return;
      }

      await this.enqueueUserWrite(user);
    } catch (error) {
      console.error(`[BackupService] Failed to back up user ${userId}:`, error);
    }
  }

  /**
   * Back up a log entry by fetching its full fresh record and enqueuing the JSON backup write
   */
  static async backupLogEntry(logId: string, prismaClient: any) {
    try {
      const log = await prismaClient.logEntry.findUnique({
        where: { id: logId },
      });

      if (!log) {
        console.warn(`[BackupService] LogEntry ${logId} not found in DB, skipping backup.`);
        return;
      }

      await this.enqueueLogWrite(log);
    } catch (error) {
      console.error(`[BackupService] Failed to back up log entry ${logId}:`, error);
    }
  }

  /**
   * Delete a log entry from the JSON backup
   */
  static async deleteLogBackup(logId: string) {
    try {
      await this.enqueueLogDelete(logId);
    } catch (error) {
      console.error(`[BackupService] Failed to delete log backup ${logId}:`, error);
    }
  }

  /**
   * Enqueue a user write operation
   */
  private static async enqueueUserWrite(user: any) {
    this.userQueue.push(user);
    if (this.isWritingUsers) return;
    this.isWritingUsers = true;

    try {
      while (this.userQueue.length > 0) {
        const nextUser = this.userQueue.shift();
        await this.processUserWrite(nextUser);
      }
    } finally {
      this.isWritingUsers = false;
    }
  }

  /**
   * Write user to JSON backup file atomically
   */
  private static async processUserWrite(user: any) {
    try {
      const dir = path.dirname(USER_BACKUP_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let users: any[] = [];
      if (fs.existsSync(USER_BACKUP_PATH)) {
        try {
          const content = fs.readFileSync(USER_BACKUP_PATH, "utf-8");
          users = JSON.parse(content);
          if (!Array.isArray(users)) users = [];
        } catch (e) {
          console.warn("[BackupService] backup_users.json was invalid, resetting to empty array.");
          users = [];
        }
      }

      const index = users.findIndex((u: any) => u.id === user.id);

      // Deep serialize fields (convert Date objects to ISO string representation)
      const serializedUser = {
        ...user,
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
        updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
        emailVerified: user.emailVerified instanceof Date ? user.emailVerified.toISOString() : user.emailVerified,
        trialEndDate: user.trialEndDate instanceof Date ? user.trialEndDate.toISOString() : user.trialEndDate,
        trialStartDate: user.trialStartDate instanceof Date ? user.trialStartDate.toISOString() : user.trialStartDate,
        subscriptionEndsAt: user.subscriptionEndsAt instanceof Date ? user.subscriptionEndsAt.toISOString() : user.subscriptionEndsAt,
      };

      if (index >= 0) {
        users[index] = serializedUser;
      } else {
        users.push(serializedUser);
      }

      // Write to temp file first, then atomically rename it
      const tempPath = USER_BACKUP_PATH + ".tmp";
      fs.writeFileSync(tempPath, JSON.stringify(users, null, 2), "utf-8");
      fs.renameSync(tempPath, USER_BACKUP_PATH);

      console.log(`[BackupService] ✅ User ${user.email} backed up successfully.`);
    } catch (error) {
      console.error("[BackupService] ❌ Error writing users backup file:", error);
    }
  }

  /**
   * Enqueue a log write operation
   */
  private static async enqueueLogWrite(log: any) {
    this.logQueue.push({ type: "write", log });
    if (this.isWritingLogs) return;
    this.isWritingLogs = true;

    try {
      while (this.logQueue.length > 0) {
        const action = this.logQueue.shift();
        if (action.type === "write") {
          await this.processLogWrite(action.log);
        } else if (action.type === "delete") {
          await this.processLogDelete(action.id);
        }
      }
    } finally {
      this.isWritingLogs = false;
    }
  }

  /**
   * Enqueue a log delete operation
   */
  private static async enqueueLogDelete(id: string) {
    this.logQueue.push({ type: "delete", id });
    if (this.isWritingLogs) return;
    this.isWritingLogs = true;

    try {
      while (this.logQueue.length > 0) {
        const action = this.logQueue.shift();
        if (action.type === "write") {
          await this.processLogWrite(action.log);
        } else if (action.type === "delete") {
          await this.processLogDelete(action.id);
        }
      }
    } finally {
      this.isWritingLogs = false;
    }
  }

  /**
   * Write log entry to JSON backup file atomically
   */
  private static async processLogWrite(log: any) {
    try {
      const dir = path.dirname(LOG_BACKUP_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let logs: any[] = [];
      if (fs.existsSync(LOG_BACKUP_PATH)) {
        try {
          const content = fs.readFileSync(LOG_BACKUP_PATH, "utf-8");
          logs = JSON.parse(content);
          if (!Array.isArray(logs)) logs = [];
        } catch (e) {
          console.warn("[BackupService] backup_log_entries.json was invalid, resetting to empty array.");
          logs = [];
        }
      }

      const index = logs.findIndex((l: any) => l.id === log.id);

      const serializedLog = {
        ...log,
        date: log.date instanceof Date ? log.date.toISOString() : log.date,
      };

      if (index >= 0) {
        logs[index] = serializedLog;
      } else {
        logs.push(serializedLog);
      }

      // Write to temp file first, then atomically rename it
      const tempPath = LOG_BACKUP_PATH + ".tmp";
      fs.writeFileSync(tempPath, JSON.stringify(logs, null, 2), "utf-8");
      fs.renameSync(tempPath, LOG_BACKUP_PATH);

      console.log(`[BackupService] ✅ LogEntry ${log.id} backed up successfully.`);
    } catch (error) {
      console.error("[BackupService] ❌ Error writing logs backup file:", error);
    }
  }

  /**
   * Delete log entry from JSON backup file atomically
   */
  private static async processLogDelete(id: string) {
    try {
      if (!fs.existsSync(LOG_BACKUP_PATH)) return;

      let logs: any[] = [];
      try {
        const content = fs.readFileSync(LOG_BACKUP_PATH, "utf-8");
        logs = JSON.parse(content);
        if (!Array.isArray(logs)) logs = [];
      } catch (e) {
        return;
      }

      const filteredLogs = logs.filter((l: any) => l.id !== id);

      if (logs.length !== filteredLogs.length) {
        const tempPath = LOG_BACKUP_PATH + ".tmp";
        fs.writeFileSync(tempPath, JSON.stringify(filteredLogs, null, 2), "utf-8");
        fs.renameSync(tempPath, LOG_BACKUP_PATH);

        console.log(`[BackupService] 🗑️ LogEntry ${id} removed from backup file.`);
      }
    } catch (error) {
      console.error("[BackupService] ❌ Error deleting from logs backup file:", error);
    }
  }
}
