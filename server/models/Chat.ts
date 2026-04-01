import mongoose, { Schema, Document, Types } from "mongoose";

export interface IChat extends Document {
  participants: Types.ObjectId[];
  lastMessage: string;
  lastMessageTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      required: true,
      validate: {
        validator: (v: Types.ObjectId[]) => v.length >= 2,
        message: "A chat must have at least 2 participants",
      },
    },

    lastMessage: {
      type: String,
      default: "",
      maxlength: 5000,
    },

    lastMessageTime: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageTime: -1 });

const Chat = mongoose.model<IChat>("Chat", chatSchema);

export default Chat;
