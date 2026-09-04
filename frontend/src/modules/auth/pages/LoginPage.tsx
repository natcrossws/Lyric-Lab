import React from 'react';
import { Center, Spinner } from '@chakra-ui/react';
import { useInstitution } from '@/core/context/InstitutionContext';

// Import all templates
import LoginDefault from './LoginTemplates/LoginDefault';
import LoginPuntoVenta from './LoginTemplates/LoginPuntoVenta';
import LoginPlayas from './LoginTemplates/LoginPlayas';
import LoginReservaciones from './LoginTemplates/LoginReservaciones';
import LoginServicios from './LoginTemplates/LoginServicios';
import LoginEscuelas from './LoginTemplates/LoginEscuelas';
import LoginCondominios from './LoginTemplates/LoginCondominios';
import LoginGlassmorphism from './LoginTemplates/LoginGlassmorphism';
import LoginDarkMinimalist from './LoginTemplates/LoginDarkMinimalist';
import LoginAbstract from './LoginTemplates/LoginAbstract';
import LoginNeumorphism from './LoginTemplates/LoginNeumorphism';
import LoginSplitScreen from './LoginTemplates/LoginSplitScreen';

const LoginPage = () => {
    const { institution } = useInstitution();
    
    // The InstitutionContext already handles fetching and caching the public theme
    const themeData = institution?.theme || {};
    const template = themeData.loginTemplate || 'default';
    
    // Pass the entire institution data (including nombre, logoBase64) plus theme data 
    // down to the templates as a combined object
    const combinedTheme = {
        nombre: institution?.nombre,
        logoBase64: institution?.logo,
        ...themeData
    };

    if (institution?.loading) {
        return (
            <Center h="100vh" bg="gray.50">
                <Spinner size="xl" color="brand.500" thickness="4px" />
            </Center>
        );
    }

    // Render corresponding template passing the theme object (which contains the custom logo, name, etc.)
    switch(template) {
        case 'punto_venta': return <LoginPuntoVenta theme={combinedTheme} />;
        case 'playas': return <LoginPlayas theme={combinedTheme} />;
        case 'reservaciones': return <LoginReservaciones theme={combinedTheme} />;
        case 'servicios': return <LoginServicios theme={combinedTheme} />;
        case 'escuelas': return <LoginEscuelas theme={combinedTheme} />;
        case 'condominios': return <LoginCondominios theme={combinedTheme} />;
        case 'glassmorphism': return <LoginGlassmorphism theme={combinedTheme} />;
        case 'dark_minimalist': return <LoginDarkMinimalist theme={combinedTheme} />;
        case 'abstract': return <LoginAbstract theme={combinedTheme} />;
        case 'neumorphism': return <LoginNeumorphism theme={combinedTheme} />;
        case 'split_screen': return <LoginSplitScreen theme={combinedTheme} />;
        case 'default':
        default:
            return <LoginDefault theme={combinedTheme} />;
    }
};

export default LoginPage;
