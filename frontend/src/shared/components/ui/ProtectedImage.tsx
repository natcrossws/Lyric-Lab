import { Image, Box, Spinner, Center } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/shared/services/api';

/**
 * Componente de imagen protegida que maneja errores 401 y redirige al login
 * Carga la imagen usando fetch con autenticación para poder manejar errores 401
 */
const ProtectedImage = ({ src, alt, onError, ...props }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Limpiar URL blob anterior si existe
    if (imageSrc && imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(imageSrc);
    }

    // Verificar si hay token antes de intentar cargar
    const token = localStorage.getItem('token');
    if (!token) {
      // No hay sesión, redirigir al login
      localStorage.removeItem('user');
      navigate('/login');
      return;
    }

    // Si es una URL blob o externa, usarla directamente
    if (src && (src.startsWith('blob:') || src.startsWith('http') && !src.includes('/api/archivos'))) {
      setImageSrc(src);
      setIsLoading(false);
      return;
    }

    // Construir URL completa
    let imageUrl = src;
    if (src && !src.startsWith('http') && !src.startsWith('data:image')) {
      // Limpiar src: remover barras dobles y espacios
      let cleanSrc = src.replace(/\/+/g, '/'); // Reemplazar múltiples barras por una sola
      
      if (cleanSrc.startsWith('/api/archivos')) {
        imageUrl = `${api.defaults.baseURL.replace('/api', '')}${cleanSrc}`;
      } else if (cleanSrc.startsWith('/')) {
        imageUrl = `${api.defaults.baseURL.replace('/api', '')}${cleanSrc}`;
      } else {
        imageUrl = `${api.defaults.baseURL}/archivos/${cleanSrc}`;
      }
      
      // Asegurar que no haya dobles barras en la URL final
      imageUrl = imageUrl.replace(/([^:]\/)\/+/g, '$1');
    }

    // Cargar imagen usando fetch con autenticación
    setIsLoading(true);
    setHasError(false);

    fetch(imageUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (response.status === 401) {
          // Token inválido o expirado
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return null;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.blob();
      })
      .then(blob => {
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          setImageSrc(blobUrl);
          setIsLoading(false);
        }
      })
      .catch(error => {
        console.error('Error loading protected image:', error);
        setHasError(true);
        setIsLoading(false);
        
        // Si es un error 401, ya se manejó en el then anterior
        // Para otros errores, llamar onError si existe
        if (onError) {
          onError(error);
        }
      });

    // Cleanup: revocar URL blob cuando el componente se desmonte o src cambie
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src, navigate]);

  // Si está cargando, mostrar spinner
  if (isLoading) {
    return (
      <Center {...props} bg="gray.100" minH="200px">
        <Spinner size="lg" color="brand.500" />
      </Center>
    );
  }

  // Si hay error o no hay src, no renderizar
  if (hasError || !imageSrc) {
    return null;
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      {...props}
    />
  );
};

export default ProtectedImage;

