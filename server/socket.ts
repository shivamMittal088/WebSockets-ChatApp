import { Server, Socket } from "socket.io";
import http from "http";
import crypto from "crypto";
import Message from "./models/Message";

function roomHash(a: string, b: string): string {
  return crypto
    .createHash("sha256")
    .update([a, b].sort().join("_"))
    .digest("hex");
}

export function setupSocket(server: http.Server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.BASE_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  const onlineUsers = new Map<string, Set<string>>(); // userId → Set of socketIds

  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);

    socket.on("register", (userId: string) => {
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId)!.add(socket.id);
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });

    // Handle Events .

    socket.on(
      "joinRoom",
      ({ fromUserId, toUserId }: { fromUserId: string; toUserId: string }) => {
        const roomId = roomHash(fromUserId, toUserId);
        // Leave all previous rooms (except own socket room)
        const rooms = socket.rooms;
        rooms.forEach((room) => {
          if (room !== socket.id) {
            socket.leave(room);
            console.log(`User ${fromUserId} left room ${room}`);
          }
        });

        socket.join(roomId);
        console.log(`User ${fromUserId} joined room ${roomId}`);
      },
    );

    socket.on(
      "leaveRoom",
      ({ fromUserId, toUserId }: { fromUserId: string; toUserId: string }) => {
        const roomId = roomHash(fromUserId, toUserId);
        socket.leave(roomId);
        console.log(`User ${fromUserId} left room ${roomId}`);
      },
    );

    socket.on(
      "sendMessage",
      async (data: {
        message: string;
        firstName: string;
        userId: string;
        targetUserId: string;
      }) => {
        try {
          const roomId = roomHash(data.userId, data.targetUserId);

          // storing message in the database .
          const saved = await Message.create({
            senderId: data.userId,
            room: roomId,
            text: data.message,
          });

          // sending message in the particular room .

          io.to(roomId).emit("receiveMessage", {
            _id: saved._id,
            text: saved.text,
            sender: data.firstName,
            senderId: data.userId,
            room: roomId,
            time: saved.createdAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          });

          console.log(
            `Message from ${data.firstName} in room ${roomId}: ${data.message}`,
          );
        } catch (err) {
          console.error("Error saving message:", err);
          socket.emit("errorMessage", { error: "Failed to send message" });
        }
      },
    );


    // typing event
  socket.on("typing", ({ fromUserId, toUserId }: { fromUserId: string; toUserId: string }) => {
    const roomId = roomHash(fromUserId, toUserId);
    socket.to(roomId).emit("userTyping", { userId: fromUserId });
  });

  // stop typing event
  socket.on("stopTyping", ({ fromUserId, toUserId }: { fromUserId: string; toUserId: string }) => {
    const roomId = roomHash(fromUserId, toUserId);
    socket.to(roomId).emit("userStoppedTyping", { userId: fromUserId });
  });

  // we will not use io.to here because we want to notify all other users in the room except the one who is typing .
  // if we use io.to then the user who is typing will also receive the typing event which is not desired .




    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      for (const [userId, sids] of onlineUsers) {
        if (sids.has(socket.id)) {
          sids.delete(socket.id);
          if (sids.size === 0) {
            onlineUsers.delete(userId);
          }
          break;
        }
      }
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });
  });

  return io;
}
