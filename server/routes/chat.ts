import { Router, Response } from "express";
import crypto from "crypto";
import authMiddleware, { AuthRequest } from "../middleware/auth";
import Chat from "../models/Chat";
import Message from "../models/Message";
import User from "../models/User";

const chatRouter = Router();

// GET /chat/users — search users to start a new chat (must be before /:chatId routes)
chatRouter.get("/users", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    const query: any = { _id: { $ne: req.userId } };

    if (search && typeof search === "string") {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { firstName: { $regex: escaped, $options: "i" } },
        { lastName: { $regex: escaped, $options: "i" } },
        { emailId: { $regex: escaped, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("_id firstName lastName emailId photoURL statusMessage");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to search users" });
  }
});

// GET /chat — list all chats for the logged-in user
chatRouter.get("/", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const chats = await Chat.find({ participants: req.userId })
      .populate("participants", "firstName lastName photoURL statusMessage")
      .sort({ lastMessageTime: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch chats" });
  }
});

// POST /chat — create or get an existing 1-on-1 chat
chatRouter.post("/", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      res.status(400).json({ message: "participantId is required" });
      return;
    }

    if (participantId === req.userId) {
      res.status(400).json({ message: "Cannot create a chat with yourself" });
      return;
    }

    const participant = await User.findById(participantId);
    if (!participant) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if chat already exists between these two users
    let chat = await Chat.findOne({
      participants: { $all: [req.userId, participantId], $size: 2 },
    }).populate("participants", "firstName lastName photoURL statusMessage");

    if (!chat) {
      chat = await Chat.create({
        participants: [req.userId, participantId],
      });
      chat = await chat.populate("participants", "firstName lastName photoURL statusMessage");
    }

    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: "Failed to create chat" });
  }
});

// GET /chat/messages/:targetUserId — get messages for a conversation (server computes hashed roomId)
chatRouter.get("/messages/:targetUserId", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { targetUserId } = req.params;
    const roomId = crypto
      .createHash('sha256')
      .update([req.userId!, targetUserId].sort().join('_'))
      .digest('hex');

    const messages = await Message.find({ room: roomId })
      .populate("senderId", "_id firstName")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// GET /chat/:chatId/messages — get messages for a chat room
chatRouter.get("/:chatId/messages", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;

    // Verify the user is a participant
    const chat = await Chat.findOne({ _id: chatId, participants: req.userId });
    if (!chat) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    const messages = await Message.find({ room: chatId })
      .populate("senderId", "firstName lastName")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

export default chatRouter;
