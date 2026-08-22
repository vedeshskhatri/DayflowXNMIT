import cookie from 'cookie';
import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';
import type { AuthPayload } from '../middleware/auth.middleware';

let io: SocketIOServer;

/**
 * Socket.IO auth reads the JWT off the handshake's cookie header,
 * NOT from an `auth: { token }` payload — because the JWT lives in an
 * httpOnly cookie, which client-side JS can't read to pass along manually.
 * The browser sends the cookie automatically as part of the handshake
 * request as long as the client connects with { withCredentials: true }.
 * See docs/VEDESH-IMPLEMENTATION-PLAN-v2.md §0 for the full reasoning.
 */
export function attachSocketServer(httpServer: HttpServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const rawCookie = socket.handshake.headers.cookie;
    if (!rawCookie) return next(new Error('unauthorized'));

    const parsed = cookie.parse(rawCookie);
    const token = parsed.token;
    if (!token) return next(new Error('unauthorized'));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
      socket.data.employeeId = payload.employeeId;
      socket.data.companyId = payload.companyId;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { companyId, employeeId } = socket.data as {
      companyId: string;
      employeeId: string;
    };

    // Company-scoped room — never trust a client-supplied companyId,
    // always derive it from the verified JWT payload above.
    socket.join(`company:${companyId}`);

    socket.on('disconnect', () => {
      // no-op for now; hook here later if presence needs to flip to
      // ABSENT on disconnect rather than only on explicit checkout
    });
  });

  return io;
}

/**
 * Call this from any module (attendance, timeoff, etc.) to broadcast
 * a real-time event to everyone in a company.
 *
 * Event names are fixed per docs/APP-FLOW.md §6 — don't invent new ones
 * ad hoc, extend this file's JSDoc if a new event is genuinely needed.
 *
 * Known events:
 *  - attendance:checkin      { employeeId, checkInTime }
 *  - attendance:checkout     { employeeId, checkOutTime, workHours }
 *  - presence:update         { employeeId, status }  // full payload, not just an id —
 *                                                      lets the frontend do
 *                                                      queryClient.setQueryData
 *                                                      instead of a refetch
 *  - timeoff:requested       { requestId, employeeId, type, dates }
 *  - timeoff:statusChanged   { requestId, status, reviewedBy }
 */
export function emitToCompany(companyId: string, event: string, payload: unknown) {
  if (!io) {
    throw new Error('Socket server not initialized — call attachSocketServer first');
  }
  io.to(`company:${companyId}`).emit(event, payload);
}
