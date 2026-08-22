import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import authRoutes from './modules/auth/auth.routes';
import employeesRoutes from './modules/employees/employees.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import { requestId } from './middleware/requestId.middleware';

const app = express();

// CORS: credentials: true is required for the httpOnly cookie to be sent
// and received across the frontend (:5173) <-> backend (:4000) origin boundary.
// Never use '*' as the origin here — it's incompatible with credentials: true anyway.
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(requestId);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route modules
app.use('/auth', authRoutes);
app.use('/employees', employeesRoutes);
app.use('/attendance', attendanceRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

export default app;
