import { Avatar, Spinner, Center } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/shared/services/api';

/**
 * Componente de Avatar protegido que maneja carga de imágenes autenticadas
 * Carga la imagen usando fetch con token para evitar errores 401 en imágenes protegidas
 */
const ProtectedAvatar = ({ src, name, onError, ...props }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Si no hay src, no intentamos cargar nada, el Avatar mostrará las iniciales (name)
    if (!src) {
        setIsLoading(false);
        return;
    }

    // Limpiar URL blob anterior si existe
    if (imageSrc && imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(imageSrc);
    }

    // Verificar token
    const token = localStorage.getItem('token');
    if (!token) {
      // Si no hay login, dejamos que falle y muestre fallback o redirigimos
      // Para un avatar, quizás no queremos redirigir agresivamente, pero por consistencia:
      // localStorage.removeItem('user');
      // navigate('/login');
      setIsLoading(false);
      return;
    }

    // Si ya es un blob o data URL, o http externo (no API), usar directo
    // Asumimos que /api/archivos es lo protegido
    if (src.startsWith('blob:') || src.startsWith('data:')) {
      setImageSrc(src);
      setIsLoading(false);
      return;
    }

    // Construir URL
    let imageUrl = src;
    
    // Lógica de construcción de URL (similar a ProtectedImage)
    if (!src.startsWith('http')) {
        let cleanSrc = src.replace(/\/+/g, '/'); // Limpiar slash dobles
        if (cleanSrc.startsWith('/api/archivos')) {
            imageUrl = `${api.defaults.baseURL.replace('/api', '')}${cleanSrc}`;
        } else if (cleanSrc.startsWith('/')) {
            imageUrl = `${api.defaults.baseURL.replace('/api', '')}${cleanSrc}`;
        } else {
            imageUrl = `${api.defaults.baseURL}/archivos/${cleanSrc}`;
        }
        imageUrl = imageUrl.replace(/([^:]\/)\/+/g, '$1');
    } else if (src.includes('/api/archivos')) {
        // Es una URL completa apuntando a nuestra API protegida
        imageUrl = src;
    } else {
        // Es una URL externa pública (ej. google, gravatar)
        setImageSrc(src);
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setHasError(false);

    fetch(imageUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (response.status === 401) {
             // Token expirado
             localStorage.removeItem('token');
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
        console.error('Error loading protected avatar:', error);
        setHasError(true);
        setIsLoading(false);
        if (onError) onError(error);
      });

    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src, navigate]);

  return (
    <Avatar
      src={imageSrc} // Pasamos la URL del blob
      name={name}
      {...props}
    />
  );
};

export default ProtectedAvatar;
