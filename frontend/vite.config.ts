import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // host: true → binds to 0.0.0.0, required for Docker so the
    // container port-forwards correctly to the host machine.
    host: true,
    port: 5173,
  },
});
