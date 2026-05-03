import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { AIChatService } from "../services/aiChatService";

const router = Router();

router.post("/message", authenticateToken, async (req, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.id;
  const { message, history } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  try {
    const result = await AIChatService.chat(userId, message, history);
    res.json(result);
  } catch (error: any) {
    console.error("[AIChatRoute] Chat error:", error);
    
    if (error.message === "INSUFFICIENT_CREDITS") {
      return res.status(402).json({ 
        error: "Insufficient credits", 
        message: "You need 1 credit per AI prompt. Upgrade your plan or purchase credits." 
      });
    }

    if (error.message?.includes("403") || error.message?.includes("denied access")) {
      return res.status(403).json({ 
        error: "AI_PERMISSION_ERROR", 
        message: "Tactical AI project has been denied access. Check mission billing and API permissions in Cloud Console." 
      });
    }

    res.status(500).json({ error: "Tactical relay failed. Systems offline." });
  }
});

export default router;
