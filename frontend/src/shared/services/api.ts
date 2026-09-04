import axios from 'axios';

// En `vite dev` / `vite preview` las peticiones van al mismo origen y Vite reenvía a Node (vite.config proxy).
// Así se evita https://localhost:3000: el certificado local es para api.devlocal.net y Safari lo rechaza.
const baseURL = import.meta.env.DEV
    ? '/api'
    : (import.meta.env.VITE_API_URL || 'https://localhost:3000/api');

console.log('API Base URL:', baseURL); // Debugging

const api = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para inyectar token
api.interceptors.request.use(
    (config) => {
        // Con Content-Type: application/json por defecto, axios serializa FormData a JSON (formDataToJSON)
        // y el backend con multer no recibe los campos. Quitar el header para que el navegador ponga
        // multipart/form-data; boundary=…
        if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
            if (config.headers) {
                if (typeof config.headers.delete === 'function') {
                    config.headers.delete('Content-Type');
                } else {
                    delete config.headers['Content-Type'];
                }
            }
        }

        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Inject Institution Context
        const activeInstId = localStorage.getItem('activeInstitutionId');
        if (activeInstId) {
            config.headers['x-institution-id'] = activeInstId;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor para manejar errores globales (ej. 401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expirado o inválido
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Solo redirigir si no estamos ya en la página de login
            // Esto evita que se recargue la página durante el proceso de login
            const currentPath = window.location.pathname;
            if (currentPath !== '/login' && !currentPath.startsWith('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
