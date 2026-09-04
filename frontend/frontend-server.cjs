const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 3001;

// 1. Proxy para la API: Redirige todo lo que empiece por /api al Backend (puerto 3000)
// Esto soluciona el error 405 y 404
app.use('/api', createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
    onError: (err, req, res) => {
        console.error('[Proxy Error]', err);
        res.status(500).send('Error de conexión con el backend');
    }
}));

// 2. Servir archivos estáticos de la carpeta dist (tu aplicación React construida)
app.use(express.static(path.join(__dirname, 'dist')));

// 3. Soporte para SPA (Single Page Application)
// Cualquier ruta no capturada antes se redirige a index.html para que React Router maneje la navegación
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Frontend Server corriendo en http://localhost:${PORT}`);
    console.log(`🔀 Proxy activo: /api -> http://localhost:3000`);
});
