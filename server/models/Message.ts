import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMessage extends Document {
  senderId: Types.ObjectId;
  room: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    room: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 5000,
    },
  },
  { timestamps: true },
);

messageSchema.index({ room: 1, createdAt: 1 });

const Message = mongoose.model<IMessage>("Message", messageSchema);

export default Message;
