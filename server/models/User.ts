import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  emailId: string;
  password: string;
  statusMessage: string;
  photoURL: string;
  bio: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    emailId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 5,
      maxlength: 100,
      validate: {
        validator: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: 'Please enter a valid email address',
      },
    },

    password: { 
        type: String, 
        required: true, 
        minlength: 8, 
        maxlength: 128 },

    statusMessage: {
      type: String,
      default: "Hey there! I am using ChatApp",
      maxlength: 150,
    },

    photoURL: { 
        type: String, 
        default: "", 
        maxlength: 500 
    },

    bio: { 
        type: String, 
        default: "", 
        maxlength: 300 
    },
  },
  { timestamps: true },
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
