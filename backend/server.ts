import app from './app';
import prisma from './core/db/prisma';
import './cron/cronJobs';

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 3000;
const APP_MODE = process.env.APP_MODE || 'development';

async function startServer() {
  try {
    // Probar conexión a DB (Prisma no tiene 'authenticate' como Sequelize, pero `$connect` sí)
    await prisma.$connect();
    console.log('✅ Conexión a Base de Datos establecida correctamente.');

    const useHttps = process.env.BACKEND_USE_HTTPS === 'true';

    const onListen = () => {
      const clientUrl = (APP_MODE === 'production')
        ? process.env.CLIENT_URL
        : ['https://localhost:5173', process.env.CLIENT_URL];
      console.log(`🚀 Servidor ${useHttps ? 'HTTPS' : 'HTTP'} corriendo en ${useHttps ? 'https' : 'http'}://0.0.0.0:${PORT}`);
      console.log(`🌍 Modo: ${APP_MODE.toUpperCase()}`);
      console.log(`📡 Client URL permitida(s): ${Array.isArray(clientUrl) ? clientUrl.join(', ') : clientUrl}`);
    };

    let server;
    const socketStub = {
      handleSocketConnection: (_io: Server) => { /* no-op */ }
    };

    if (useHttps) {
      const httpsOptions = {
        key: fs.readFileSync(path.join(__dirname, 'certs/api.devlocal.net.key')),
        cert: fs.readFileSync(path.join(__dirname, 'certs/api.devlocal.net.crt'))
      };
      server = https.createServer(httpsOptions, app);
    } else {
      server = http.createServer(app);
    }

    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    socketStub.handleSocketConnection(io);

    server.listen(PORT, onListen);
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
