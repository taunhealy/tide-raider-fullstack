import { IgApiClient } from "instagram-private-api";
import { prisma } from "../lib/prisma";
import * as fs from "fs";
import * as path from "path";

// Session cache file path (persists between runs so we don't re-login daily)
const SESSION_FILE = path.join(process.cwd(), ".ig-session.json");

class InstagramServiceClass {
  private ig: IgApiClient;
  private isLoggedIn = false;

  constructor() {
    this.ig = new IgApiClient();
  }

  /**
   * Login and persist session to disk so we don't re-login on every cron run.
   * Re-logging daily is the #1 trigger for Instagram's bot detection.
   */
  async login(): Promise<void> {
    const username = process.env.IG_USERNAME;
    const password = process.env.IG_PASSWORD;

    if (!username || !password) {
      throw new Error("IG_USERNAME and IG_PASSWORD env vars are required");
    }

    this.ig.state.generateDevice(username);

    // Try to restore saved session first
    if (fs.existsSync(SESSION_FILE)) {
      try {
        const savedSession = JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
        await this.ig.state.deserialize(savedSession);
        console.log("[Instagram] ✅ Restored session from disk");
        this.isLoggedIn = true;
        return;
      } catch (err) {
        console.warn("[Instagram] ⚠️ Saved session invalid, re-logging in...");
        fs.unlinkSync(SESSION_FILE);
      }
    }

    // Fresh login
    console.log(`[Instagram] 🔐 Logging in as @${username}...`);
    await this.ig.simulate.preLoginFlow();
    await this.ig.account.login(username, password);

    // Save session to disk
    const serialized = await this.ig.state.serialize();
    delete serialized.constants; // Don't persist constants
    fs.writeFileSync(SESSION_FILE, JSON.stringify(serialized));

    await this.ig.simulate.postLoginFlow();
    this.isLoggedIn = true;
    console.log("[Instagram] ✅ Login successful, session saved");
  }

  /**
   * Post an image buffer as an Instagram Story
   */
  async postStory(imageBuffer: Buffer): Promise<void> {
    if (!this.isLoggedIn) {
      await this.login();
    }

    console.log("[Instagram] 📸 Posting story...");

    await this.ig.publish.story({
      file: imageBuffer,
    });

    console.log("[Instagram] ✅ Story posted successfully");
  }

  /**
   * Invalidate the saved session (call if login starts failing)
   */
  clearSession(): void {
    if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE);
      console.log("[Instagram] 🗑️ Session cleared");
    }
    this.isLoggedIn = false;
  }
}

export const InstagramService = new InstagramServiceClass();
