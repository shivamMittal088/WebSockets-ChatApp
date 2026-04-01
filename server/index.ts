import express, { Response } from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRouter from './routes/auth';
import chatRouter from './routes/chat';
import authMiddleware, { AuthRequest } from './middleware/auth';
import { setupSocket } from './socket';

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/auth', authRouter);
app.use('/chat', chatRouter);

// Protected API route
app.get('/api/hello', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ message: 'Hello from the Node.js backend!', userId: req.userId });
});

// Setup WebSocket
setupSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
