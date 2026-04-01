import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const authRouter = Router();

// POST /auth/signup
authRouter.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, emailId, password } = req.body;

    if (!firstName || !lastName || !emailId || !password) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ emailId: emailId.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists with this email' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: hashedPassword,
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailId: user.emailId,
        statusMessage: user.statusMessage,
        photoURL: user.photoURL,
        bio: user.bio,
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Email is already registered' });
      return;
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({ message: messages.join(', ') });
      return;
    }
    res.status(500).json({ message: 'Server error, please try again later' });
  }
});

// POST /auth/login
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Find user
    const user = await User.findOne({ emailId: emailId.toLowerCase() });
    if (!user) {
      res.status(400).json({ message: 'Invalid email or password' });
      return;
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid email or password' });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailId: user.emailId,
        statusMessage: user.statusMessage,
        photoURL: user.photoURL,
        bio: user.bio,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error, please try again later' });
  }
});

export default authRouter;
