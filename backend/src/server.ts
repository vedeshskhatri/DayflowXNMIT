import 'dotenv/config';
import http from 'http';
import app from './app';
import { attachSocketServer } from './sockets';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

// Socket.IO attaches to the same HTTP server instance as Express —
// not a separate port. This keeps CORS/cookie config identical for both.
const httpServer = http.createServer(app);
attachSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Dayflow backend listening on :${PORT}`);
});
