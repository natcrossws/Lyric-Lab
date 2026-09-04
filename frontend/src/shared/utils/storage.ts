/**
 * Utilidades para manejo seguro de localStorage
 * Incluye manejo de errores de cuota y optimización de datos
 */

/**
 * Guarda datos en localStorage con manejo de errores
 * @param {string} key - Clave
 * @param {*} value - Valor a guardar
 * @returns {boolean} - true si se guardó exitosamente
 */
export const setStorageItem = (key: string, value: unknown): boolean => {
    try {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        
        // Verificar tamaño aproximado (1MB = 1,048,576 bytes)
        const sizeInBytes = new Blob([stringValue]).size;
        if (sizeInBytes > 1000000) { // Más de 1MB
            console.warn(`⚠️ Advertencia: ${key} es muy grande (${(sizeInBytes / 1024).toFixed(2)}KB)`);
        }
        
        localStorage.setItem(key, stringValue);
        return true;
    } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
            console.error(`❌ Error: localStorage lleno. No se pudo guardar ${key}`);
            
            // Intentar limpiar datos antiguos
            try {
                clearOldStorageData();
                // Intentar de nuevo
                localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
                return true;
            } catch (retryError) {
                console.error('❌ Error: No se pudo guardar después de limpiar localStorage');
                return false;
            }
        }
        console.error(`Error guardando en localStorage:`, error);
        return false;
    }
};

/**
 * Obtiene datos de localStorage
 * @param {string} key - Clave
 * @param {*} defaultValue - Valor por defecto si no existe
 * @returns {*} - Valor o defaultValue
 */
export const getStorageItem = (key: string, defaultValue: unknown = null): unknown => {
    try {
        const item = localStorage.getItem(key);
        if (item === null) return defaultValue;
        
        // Intentar parsear como JSON, si falla devolver como string
        try {
            return JSON.parse(item);
        } catch {
            return item;
        }
    } catch (error) {
        console.error(`Error leyendo de localStorage:`, error);
        return defaultValue;
    }
};

/**
 * Elimina un item de localStorage
 * @param {string} key - Clave
 */
export const removeStorageItem = (key: string): void => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Error eliminando de localStorage:`, error);
    }
};

/**
 * Limpia datos antiguos o innecesarios de localStorage
 */
export const clearOldStorageData = () => {
    try {
        // Lista de claves a preservar
        const keysToKeep = ['token', 'user'];
        
        // Obtener todas las claves
        const allKeys = Object.keys(localStorage);
        
        // Eliminar claves que no están en la lista de preservar
        allKeys.forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });
        
        console.log('🧹 localStorage limpiado (datos antiguos eliminados)');
    } catch (error) {
        console.error('Error limpiando localStorage:', error);
    }
};

/**
 * Guarda solo los datos esenciales del usuario
 * @param {Object} userData - Datos completos del usuario
 * @returns {Object} - Datos optimizados
 */
export const optimizeUserData = (userData: Record<string, any> | null): Record<string, any> | null => {
    if (!userData) return null;
    
    // Solo guardar campos esenciales
    return {
        id: userData.id || userData.id_usuario, // Handle both id formats if possible
        nombre: userData.nombre,
        email: userData.email,
        role: userData.role || userData.tipo, // Normalize role
        id_rol: userData.id_rol || userData.fk_id_cat_tipo_usuario,
        foto_url: userData.foto_url || userData.foto_base64,
        campass: userData.campass, // Added campass
        institucion: userData.institucion, // Nombre de la escuela
        fk_id_padre: userData.fk_id_padre, // id del padre asignado
        hasTutores: userData.hasTutores, // Flag que indica si tiene tutores (padre principal o adicionales)
        pendingLegalDocs: userData.pendingLegalDocs, // Flag for legal docs acceptance
        requiresSubscriptionPayment: userData.requiresSubscriptionPayment,
        pagadoAlCorriente: userData.pagadoAlCorriente,
        // Multi-tenancy
        fk_id_institucion: userData.fk_id_institucion,
        myInstitutions: userData.myInstitutions
    };
};

/** Lee el usuario persistido en localStorage. */
export const getUserData = (): Record<string, any> | null => {
    const raw = getStorageItem('user', null);
    if (!raw || typeof raw !== 'object') return null;
    return raw as Record<string, any>;
};

/** Guarda el usuario (optimizado) en localStorage. */
export const setUserData = (userData: Record<string, any> | null): boolean => {
    if (!userData) {
        removeStorageItem('user');
        return true;
    }
    const optimized = optimizeUserData(userData);
    return setStorageItem('user', optimized);
};

/**
 * Obtiene el tamaño actual de localStorage
 * @returns {Object} - { used: bytes, total: bytes, percentage: number }
 */
export const getStorageSize = () => {
    try {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
            }
        }
        
        // Límite típico de localStorage: 5-10MB
        const limit = 5 * 1024 * 1024; // 5MB
        const percentage = (total / limit) * 100;
        
        return {
            used: total,
            total: limit,
            percentage: percentage,
            usedKB: (total / 1024).toFixed(2),
            usedMB: (total / (1024 * 1024)).toFixed(2)
        };
    } catch (error) {
        console.error('Error calculando tamaño de localStorage:', error);
        return { used: 0, total: 0, percentage: 0 };
    }
};
