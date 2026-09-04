import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { applyDynamicTheme } from '../theme/dynamicTheme';
import api from '@/shared/services/api';

const InstitutionContext = createContext<any>(null);

export const InstitutionProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [institution, setInstitution] = useState(() => {
        const defaultInst = {
            id: 1,
            nombre: 'Mi Sistema',
            logo: null,
            theme: {
                primaryColor: '#3182CE',
                secondaryColor: '#2B6CB0',
                mode: 'light',
                loginTemplate: 'default'
            },
            loading: false
        };

        if (typeof window === 'undefined') return defaultInst;
        
        try {
            const storedUserStr = localStorage.getItem('user');
            const storedActiveInstDataStr = localStorage.getItem('activeInstitutionData');
            
            if (!storedUserStr) {
                if (storedActiveInstDataStr) {
                    return JSON.parse(storedActiveInstDataStr);
                }
                return defaultInst;
            }
            const parsedUser = JSON.parse(storedUserStr);
            const userInsts = parsedUser.myInstitutions || [];
            const storedId = localStorage.getItem('activeInstitutionId');
            
            let activeInst = null;
            if (storedId) {
                activeInst = userInsts.find((i: any) => i.id === parseInt(storedId));
            }
            if (!activeInst && userInsts.length > 0) {
                 activeInst = userInsts.find((i: any) => i.id === parsedUser.fk_id_institucion) || userInsts[0];
            }
            
            if (activeInst) {
                const activeTheme = activeInst.theme || defaultInst.theme;
                if (activeTheme.primaryColor && activeTheme.primaryColor.includes('var(')) {
                    activeTheme.primaryColor = '#3182CE';
                }
                return {
                    id: activeInst.id,
                    nombre: activeInst.nombre,
                    logo: activeInst.logo || null,
                    theme: activeTheme,
                    loading: false
                };
            }
        } catch (e) {
            console.error('Error parsing institution sync', e);
        }
        return defaultInst;
    });
    const [myInstitutions, setMyInstitutions] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const storedUserStr = localStorage.getItem('user');
                if (storedUserStr) {
                    const parsedUser = JSON.parse(storedUserStr);
                    return parsedUser.myInstitutions || [];
                }
            } catch(e) {}
        }
        return [];
    });

    useEffect(() => {
        // Lógica de detección de Institución
        // 1. Si el usuario está logueado, usar su institución
        if (user) {
            console.log(`[InstitutionContext] User logged in.`);
            
            // Load list from user object
            const userInsts = user.myInstitutions || [];
            setMyInstitutions(userInsts);

            // Determine active institution
            const storedId = localStorage.getItem('activeInstitutionId');
            
            let activeInst = null;
            if (storedId) {
                // Try to find the stored one in the user's list
                activeInst = userInsts.find((i: any) => i.id === parseInt(storedId));
            }
            
            // Fallback: If not found or not stored, use user.fk_id_institucion (current context)
            if (!activeInst) {
                 if (userInsts.length > 0) {
                     // Prefer the one compatible with current user context or just the first one
                     activeInst = userInsts.find((i: any) => i.id === user.fk_id_institucion) || userInsts[0];
                 } else {
                     // Legacy fallback purely largely based on single props
                     activeInst = { 
                         id: user.fk_id_institucion || 1, 
                         nombre: user.institucion || 'Mi Sistema' 
                     };
                 }
            }
            
            // Persist the decision if missing
            if (activeInst && (!storedId || parseInt(storedId) !== activeInst.id)) {
                localStorage.setItem('activeInstitutionId', activeInst.id);
            }

            const activeTheme = activeInst.theme || { 
                primaryColor: '#3182CE',
                secondaryColor: '#2B6CB0', 
                tertiaryColor: '#2B6CB0',
                backgroundColor: '#f8fafc',
                textColor: '#1a202c',
                loginBackgroundType: 'waves',
                loginPrimaryColor: '',
                loginSecondaryColor: '',
                loginBackgroundColor: '',
                loginBackgroundUrl: ''
            };

            // Sanitize DB values that might have stored CSS variables by mistake
            if (activeTheme.primaryColor && activeTheme.primaryColor.includes('var(')) {
                activeTheme.primaryColor = '#3182CE';
            }

            setInstitution((prev: any) => ({ 
                ...prev, 
                id: activeInst.id,
                nombre: activeInst.nombre,
                logo: activeInst.logo || null,
                theme: activeTheme
            }));
            // Apply Dynamic Theme to CSS Variables
            if (activeTheme.primaryColor) {
                applyDynamicTheme({
                    primaryColorHex: activeTheme.primaryColor,
                    secondaryColorHex: activeTheme.secondaryColor,
                    tertiaryColorHex: activeTheme.tertiaryColor,
                    backgroundColorHex: activeTheme.backgroundColor,
                    textColorHex: activeTheme.textColor
                });
            }

            // Cache active institution data for public/login pages
            localStorage.setItem('activeInstitutionData', JSON.stringify({
                id: activeInst.id,
                nombre: activeInst.nombre,
                logo: activeInst.logo || null,
                theme: activeTheme,
                loading: false
            }));

        } else {
            // No user logged in. Fetch public theme from backend to ensure global sync across browsers
            const fetchPublicTheme = async () => {
                try {
                    const hostname = window.location.hostname;
                    const res = await api.get(`/general/tema?hostname=${hostname}`);
                    if (res.data && res.data.success && res.data.data) {
                        const themeData = res.data.data;
                        const publicTheme = {
                            primaryColor: themeData.primaryColor || '#3182CE',
                            secondaryColor: themeData.secondaryColor || '#2B6CB0',
                            tertiaryColor: themeData.tertiaryColor || '#2B6CB0',
                            backgroundColor: themeData.backgroundColor || '#f8fafc',
                            textColor: themeData.textColor || '#1a202c',
                            loginBackgroundType: themeData.loginBackgroundType || 'waves',
                            loginPrimaryColor: themeData.loginPrimaryColor || '',
                            loginSecondaryColor: themeData.loginSecondaryColor || '',
                            loginBackgroundColor: themeData.loginBackgroundColor || '',
                            loginBackgroundUrl: themeData.loginBackgroundUrl || ''
                        };

                        setInstitution((prev: any) => ({
                            ...prev,
                            nombre: themeData.nombre || prev.nombre,
                            logo: themeData.logoBase64 || prev.logo,
                            theme: publicTheme
                        }));

                        applyDynamicTheme({
                            primaryColorHex: publicTheme.primaryColor,
                            secondaryColorHex: publicTheme.secondaryColor,
                            tertiaryColorHex: publicTheme.tertiaryColor,
                            backgroundColorHex: publicTheme.backgroundColor,
                            textColorHex: publicTheme.textColor
                        });

                        localStorage.setItem('activeInstitutionData', JSON.stringify({
                            id: 1,
                            nombre: themeData.nombre || 'Mi Sistema',
                            logo: themeData.logoBase64 || null,
                            theme: publicTheme,
                            loading: false
                        }));
                    }
                } catch (e) {
                    console.error('[InstitutionContext] Error fetching public theme', e);
                }
            };
            fetchPublicTheme();
        }
    }, [user]);

    const switchInstitution = (institutionId: number) => {
        const target = myInstitutions.find(i => i.id === institutionId);
        if (target) {
            setInstitution({
                id: target.id,
                nombre: target.nombre,
                logo: target.logo,
                theme: target.theme || { primaryColor: '#3182CE', secondaryColor: '#2B6CB0', mode: 'light' },
                loading: false
            });
            localStorage.setItem('activeInstitutionId', target.id);
            // Reload to ensure API interceptors and Queries use new ID
            window.location.reload(); 
        }
    };

    useEffect(() => {
        if (institution?.nombre) {
            document.title = institution.nombre;
        } else {
            document.title = 'Mi Sistema';
        }
    }, [institution?.nombre]);

    return (
        <InstitutionContext.Provider value={{ institution, setInstitution, myInstitutions, switchInstitution }}>
            {children}
        </InstitutionContext.Provider>
    );
};

export const useInstitution = () => useContext(InstitutionContext);
