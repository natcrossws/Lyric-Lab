import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import api from './api';

/**
 * Servicio para manejar operaciones WebAuthn/Passkeys
 */
export const webauthnService = {
    /**
     * Inicia el proceso de registro de una nueva Passkey
     * @param {string} deviceName - Nombre descriptivo del dispositivo
     * @returns {Promise<Object>} Resultado del registro
     */
    async registerPasskey(deviceName: string | null = null): Promise<any> {
        try {
            // 1. Obtener opciones de registro del servidor
            const { data } = await api.post('/webauthn/register/options');
            
            if (!data.success || !data.options) {
                throw new Error('Error al obtener opciones de registro');
            }

            // 2. Iniciar el registro en el navegador
            const registrationResponse = await startRegistration(data.options);

            // 3. Enviar la respuesta al servidor para verificar
            const verifyResponse = await api.post('/webauthn/register/verify', {
                ...registrationResponse,
                deviceName: deviceName || this.getDeviceName()
            });

            return verifyResponse.data;
        } catch (error) {
            console.error('Error registrando Passkey:', error);
            throw error;
        }
    },

    /**
     * Inicia el proceso de autenticación con Passkey
     * @param {string} email - Email del usuario
     * @returns {Promise<Object>} Resultado de la autenticación (incluye token)
     */
    async authenticateWithPasskey(email: string): Promise<any> {
        try {
            // 1. Obtener opciones de autenticación del servidor
            const { data } = await api.post('/webauthn/auth/options', { email });
            
            if (!data.success || !data.options) {
                throw new Error(data.message || 'Error al obtener opciones de autenticación');
            }

            // 2. Iniciar la autenticación en el navegador
            const authenticationResponse = await startAuthentication(data.options);

            // 3. Enviar la respuesta al servidor para verificar
            const verifyResponse = await api.post('/webauthn/auth/verify', authenticationResponse);

            return verifyResponse.data;
        } catch (error) {
            console.error('Error autenticando con Passkey:', error);
            throw error;
        }
    },

    /**
     * Verifica si un usuario tiene Passkeys registradas consultando las opciones
     * @param {string} email
     * @returns {Promise<boolean>}
     */
    async checkPasskeyAvailability(email: string): Promise<boolean> {
        try {
            const { data } = await api.post('/webauthn/auth/options', { email });
            // Si el servidor devuelve opciones con allowCredentials no vacío, el usuario tiene passkeys
            return data.success && data.options && data.options.allowCredentials && data.options.allowCredentials.length > 0;
        } catch (error) {
            // Si el usuario no existe o hay error, asumimos que no tiene passkeys
            return false;
        }
    },

    /**
     * Obtiene las Passkeys registradas del usuario actual
     * @returns {Promise<Array>} Lista de credenciales
     */
    async getUserCredentials(): Promise<any[]> {
        try {
            const { data } = await api.get('/webauthn/credentials');
            return data.credentials || [];
        } catch (error) {
            console.error('Error obteniendo credenciales:', error);
            throw error;
        }
    },

    /**
     * Elimina una Passkey
     * @param {number|string} credentialId - ID de la credencial a eliminar
     * @returns {Promise<Object>} Resultado de la eliminación
     */
    async deleteCredential(credentialId: number | string): Promise<any> {
        try {
            const { data } = await api.delete(`/webauthn/credentials/${credentialId}`);
            return data;
        } catch (error) {
            console.error('Error eliminando credencial:', error);
            throw error;
        }
    },

    /**
     * Verifica si WebAuthn está disponible en el navegador
     * @returns {boolean}
     */
    isSupported() {
        return typeof window !== 'undefined' && 
               'PublicKeyCredential' in window &&
               typeof PublicKeyCredential !== 'undefined';
    },

    /**
     * Verifica si el dispositivo actual puede usar passkeys
     * (tiene autenticadores biométricos disponibles)
     * @returns {Promise<boolean>}
     */
    async canDeviceUsePasskeys() {
        if (!this.isSupported()) {
            return false;
        }

        try {
            // Verificar si hay autenticadores de plataforma disponibles
            // Usamos isUserVerifyingPlatformAuthenticatorAvailable si está disponible
            if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
                const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                return isAvailable;
            }
            
            // Fallback: intentar detectar si hay autenticadores disponibles
            // Algunos navegadores no tienen isUserVerifyingPlatformAuthenticatorAvailable
            // En ese caso, asumimos que si WebAuthn está soportado, puede haber autenticadores
            // El usuario podrá intentar y si falla, se le mostrará la opción de contraseña
            return true;
        } catch (error) {
            console.warn('Error verificando disponibilidad de autenticadores:', error);
            // En caso de error, asumimos que no hay disponibles para ser conservadores
            return false;
        }
    },

    /**
     * Obtiene un nombre descriptivo para el dispositivo actual
     * @returns {string}
     */
    getDeviceName() {
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        
        if (/iPhone|iPad|iPod/.test(userAgent)) {
            return `iPhone/iPad`;
        } else if (/Android/.test(userAgent)) {
            return `Android`;
        } else if (/Mac/.test(platform)) {
            return `Mac`;
        } else if (/Win/.test(platform)) {
            return `Windows`;
        } else if (/Linux/.test(platform)) {
            return `Linux`;
        }
        
        return 'Dispositivo';
    }
};

export default webauthnService;
