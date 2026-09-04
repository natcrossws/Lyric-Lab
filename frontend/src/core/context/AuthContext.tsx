import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/shared/services/api';
import webauthnService from '@/shared/services/webauthnService';
import { setStorageItem, getStorageItem, removeStorageItem, optimizeUserData } from '@/shared/utils/storage';

const AuthContext = createContext<any>(null);


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(() => {
        if (typeof window !== 'undefined') {
            const storedUser = getStorageItem('user');
            const token = getStorageItem('token');
            if (storedUser && token) {
                return storedUser;
            }
        }
        return null;
    });
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        // Any async validation could go here if needed later
    }, []);

    const login = async (email: string, password?: string) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user: userData } = response.data;

            // Optimizar y persistir solo datos esenciales
            const optimizedUser = optimizeUserData(userData);
            const tokenSaved = setStorageItem('token', token);
            const userSaved = setStorageItem('user', optimizedUser);

            if (!tokenSaved || !userSaved) {
                console.warn('⚠️ Advertencia: No se pudo guardar en localStorage, pero el login fue exitoso');
            }

            setUser(optimizedUser);
            return { success: true };
        } catch (error: any) {
            console.error('Login error:', error);
            removeStorageItem('token');
            removeStorageItem('user');
            // El backend devuelve 'error' en lugar de 'message'
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error al iniciar sesión';
            return {
                success: false,
                message: errorMessage
            };
        }
    };

    const loginWithPasskey = async (email: string) => {
        try {
            const result = await webauthnService.authenticateWithPasskey(email);
            const { token, user: userData } = result;

            // Optimizar y persistir solo datos esenciales
            const optimizedUser = optimizeUserData(userData);
            const tokenSaved = setStorageItem('token', token);
            const userSaved = setStorageItem('user', optimizedUser);

            if (!tokenSaved || !userSaved) {
                console.warn('⚠️ Advertencia: No se pudo guardar en localStorage, pero el login fue exitoso');
            }

            setUser(optimizedUser);
            return { success: true };
        } catch (error: any) {
            console.error('Passkey login error:', error);
            removeStorageItem('token');
            removeStorageItem('user');
            const errorMessage = error.response?.data?.message || error.message || 'Error al autenticarse con Passkey';
            return {
                success: false,
                message: errorMessage
            };
        }
    };

    const logout = () => {
        removeStorageItem('token');
        removeStorageItem('user');
        setUser(null);
    };

    /** Actualiza usuario en memoria y localStorage (p. ej. tras aceptar documentos legales). */
    const updateLocalUser = (partial: any) => {
        setUser((prev: any) => {
            if (!prev) return null;
            const next = { ...prev, ...partial };
            setStorageItem('user', next);
            return next;
        });
    };

    const value = {
        user,
        login,
        loginWithPasskey,
        logout,
        updateLocalUser,
        isAuthenticated: !!user,
        loading,
        isWebAuthnSupported: webauthnService.isSupported()
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
};
