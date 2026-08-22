import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import authRoutes from './modules/auth/auth.routes';
import { requestId } from './middleware/requestId.middleware';

const app = express();

// CORS: credentials: true is required for the httpOnly cookie to be sent
// and received across the frontend <-> backend origin boundary.
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    // Allow localhost or local LAN addresses
    if (
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.startsWith('http://172.') ||
      origin.startsWith('http://192.168.') ||
      origin.startsWith('http://10.') ||
      origin === process.env.FRONTEND_ORIGIN
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.use(requestId);

app.get('/', (_req, res) => {
  res.json({
    name: 'Dayflow HRMS API',
    version: '1.0.0',
    status: 'running',
    docs: 'https://github.com/vedeshskhatri/DayflowXNMIT',
    health: '/health',
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

export default app;
