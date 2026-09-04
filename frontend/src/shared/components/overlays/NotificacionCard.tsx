import {
  Box,
  Card,
  CardBody,
  Text,
  Badge,
  HStack,
  VStack,
  Image,
  Flex,
  Divider,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { FiCheck, FiArchive } from 'react-icons/fi';
import api from '@/shared/services/api';
import ProtectedImage from '../ui/ProtectedImage';

// Función simple para formatear fechas
const formatearFecha = (fecha) => {
  if (!fecha) return '';
  try {
    const date = new Date(fecha);
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const dia = date.getDate();
    const mes = meses[date.getMonth()];
    const año = date.getFullYear();
    return `${dia} de ${mes}, ${año}`;
  } catch (e) {
    return fecha;
  }
};

// Iconos para diferentes tipos de notificaciones
const getNotificationIcon = (tipo) => {
  const icons = {
    promocion: '🎉',
    curso: '📚',
    pago: '💳',
    recordatorio: '⏰',
    bitacora: '📝',
    meta: '🎯',
    alumno: '👤',
    clase: '🎨',
    default: '🔔'
  };
  return icons[tipo] || icons.default;
};

// Colores según el tipo de notificación
const getNotificationColors = (tipo, leida) => {
  const colors = {
    promocion: {
      bg: leida ? 'white' : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
      border: leida ? 'gray.200' : 'yellow.300',
      accent: 'yellow.500',
      badge: 'yellow'
    },
    curso: {
      bg: leida ? 'white' : 'linear-gradient(135deg, #E8EDE0 0%, #E5F0F2 100%)',
      border: leida ? 'gray.200' : 'brand.300',
      accent: 'brand.500',
      badge: 'brand'
    },
    pago: {
      bg: leida ? 'white' : 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
      border: leida ? 'gray.200' : 'green.300',
      accent: 'green.500',
      badge: 'green'
    },
    recordatorio: {
      bg: leida ? 'white' : 'linear-gradient(135deg, #FED7AA 0%, #FCD34D 100%)',
      border: leida ? 'gray.200' : 'orange.300',
      accent: 'orange.500',
      badge: 'orange'
    },
    bitacora: {
      bg: leida ? 'white' : 'linear-gradient(135deg, #E9D5FF 0%, #DDD6FE 100%)',
      border: leida ? 'gray.200' : 'purple.300',
      accent: 'purple.500',
      badge: 'purple'
    },
    meta: {
      bg: leida ? 'white' : 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)',
      border: leida ? 'gray.200' : 'pink.300',
      accent: 'pink.500',
      badge: 'pink'
    },
    alumno: {
      bg: leida ? 'white' : 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
      border: leida ? 'gray.200' : 'indigo.300',
      accent: 'indigo.500',
      badge: 'indigo'
    },
    clase: {
      bg: leida ? 'white' : 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
      border: leida ? 'gray.200' : 'brand.300',
      accent: 'brand.500',
      badge: 'brand'
    },
    default: {
      bg: leida ? 'white' : 'brand.50',
      border: leida ? 'gray.200' : 'brand.200',
      accent: 'brand.500',
      badge: 'brand'
    }
  };
  return colors[tipo] || colors.default;
};

const NotificacionCard = ({ notificacion, onMarcarLeida, onArchivar }) => {
  const { id, id_notificacion, titulo, mensaje, fecha, leida, tipo = 'default', imagen, imagen_url, html } = notificacion;
  // Obtener URL de imagen desde el archivo relacionado o campos legacy
  // Si imagen es un objeto (del backend), usar nombre_servidor
  // Si imagen es una string (vista previa con blob URL o URL directa), usarla directamente
  const imagenUrl = typeof notificacion.imagen === 'object' && notificacion.imagen?.nombre_servidor
    ? `${api.defaults.baseURL}/archivos/${notificacion.imagen.nombre_servidor}` 
    : (imagen || imagen_url); // Soporta vista previa (blob URLs) y campos legacy
  const cardId = id || id_notificacion;
  const colors = getNotificationColors(tipo, leida);
  const icon = getNotificationIcon(tipo);

  // Formatear fecha
  const fechaFormateada = formatearFecha(fecha);

  return (
    <Card
      key={id}
      bg={colors.bg}
      border="2px solid"
      borderColor={colors.border}
      borderRadius="16px"
      overflow="hidden"
      transition="all 0.3s ease-in-out"
      boxShadow={leida
        ? '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        : '0 4px 12px 0 rgba(0, 0, 0, 0.15)'
      }
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px 0 rgba(0, 0, 0, 0.2)',
        borderColor: colors.accent,
      }}
      position="relative"
    >
      {/* Indicador lateral de color */}
      <Box
        position="absolute"
        left="0"
        top="0"
        bottom="0"
        w="4px"
        bg={colors.accent}
        opacity={leida ? 0.5 : 1}
      />

      <CardBody p={6}>
        <VStack align="stretch" spacing={4}>
          {/* Header con icono, título y badge */}
          <Flex justify="space-between" align="flex-start" gap={4}>
            <HStack spacing={3} flex={1}>
              <Box
                fontSize="28px"
                lineHeight="1"
                filter={leida ? 'grayscale(50%)' : 'none'}
              >
                {icon}
              </Box>
              <Text
                fontWeight="700"
                fontSize="18px"
                color="gray.900"
                lineHeight="1.3"
              >
                {titulo}
              </Text>
            </HStack>
            <Badge
              colorScheme={colors.badge}
              borderRadius="8px"
              px={3}
              py={1}
              fontSize="11px"
              fontWeight="700"
              textTransform="uppercase"
              letterSpacing="0.5px"
              opacity={leida ? 0.7 : 1}
            >
              {leida ? 'Leída' : 'Nueva'}
            </Badge>
          </Flex>

          {/* Imagen si existe */}
          {imagenUrl && imagenUrl.trim() !== '' && (
            <Box
              borderRadius="12px"
              overflow="hidden"
              mt={2}
              boxShadow="0 4px 8px 0 rgba(0, 0, 0, 0.1)"
            >
              <ProtectedImage
                src={
                  imagenUrl.startsWith('blob:') 
                    ? imagenUrl 
                    : imagenUrl.startsWith('http') 
                      ? imagenUrl 
                      : imagenUrl.startsWith('/api/archivos')
                        ? imagenUrl
                        : imagenUrl.startsWith('/') 
                          ? `${api.defaults.baseURL}${imagenUrl}`
                          : `${api.defaults.baseURL}/archivos/${imagenUrl}`
                }
                alt={titulo}
                w="100%"
                h="auto"
                objectFit="cover"
                maxH="300px"
                onError={() => {}} as any
              />
            </Box>
          )}

          {/* Contenido del mensaje */}
          <Box>
            {html ? (
              <Box
                dangerouslySetInnerHTML={{ __html: html }}
                sx={{
                  '& p': {
                    marginBottom: '12px',
                    color: 'gray.700',
                    fontSize: '15px',
                    lineHeight: '1.7',
                  },
                  '& h1, & h2, & h3': {
                    color: 'gray.900',
                    fontWeight: '700',
                    marginBottom: '8px',
                    marginTop: '16px',
                  },
                  '& h1': { fontSize: '20px' },
                  '& h2': { fontSize: '18px' },
                  '& h3': { fontSize: '16px' },
                  '& ul, & ol': {
                    paddingLeft: '20px',
                    marginBottom: '12px',
                  },
                  '& li': {
                    marginBottom: '6px',
                    color: 'gray.700',
                  },
                  '& a': {
                    color: colors.accent,
                    fontWeight: '600',
                    textDecoration: 'underline',
                  },
                  '& strong': {
                    color: 'gray.900',
                    fontWeight: '700',
                  },
                  '& em': {
                    fontStyle: 'italic',
                  },
                  '& blockquote': {
                    borderLeft: `4px solid ${colors.accent}`,
                    paddingLeft: '16px',
                    marginLeft: '0',
                    fontStyle: 'italic',
                    color: 'gray.600',
                  },
                }}
              />
            ) : (
              <Text
                color="gray.700"
                fontSize="15px"
                lineHeight="1.7"
                whiteSpace="pre-wrap"
              >
                {mensaje}
              </Text>
            )}
          </Box>

          {/* Footer con fecha y acciones */}
          <Divider borderColor="gray.200" />
          <Flex justify="space-between" align="center">
            <HStack spacing={2}>
              <Text fontSize="12px" color="gray.500">
                📅
              </Text>
              <Text fontSize="12px" color="gray.500" fontWeight="500">
                {fechaFormateada}
              </Text>
              {tipo !== 'default' && (
                <Badge
                  colorScheme={colors.badge}
                  variant="subtle"
                  borderRadius="6px"
                  px={2}
                  py={1}
                  fontSize="10px"
                  textTransform="capitalize"
                >
                  {tipo}
                </Badge>
              )}
            </HStack>

            {/* Botones de acción */}
            <HStack spacing={2}>
              {!leida && onMarcarLeida && (
                <Tooltip label="Marcar como leída" placement="top">
                  <IconButton
                    icon={<FiCheck />}
                    size="sm"
                    variant="ghost"
                    colorScheme="green"
                    aria-label="Marcar como leída"
                    onClick={onMarcarLeida}
                    _hover={{
                      bg: 'green.50',
                      transform: 'scale(1.1)'
                    }}
                    transition="all 0.2s"
                  />
                </Tooltip>
              )}
              {onArchivar && (
                <Tooltip label="Archivar" placement="top">
                  <IconButton
                    icon={<FiArchive />}
                    size="sm"
                    variant="ghost"
                    colorScheme="brand"
                    aria-label="Archivar"
                    onClick={onArchivar}
                    _hover={{
                      bg: 'brand.50',
                      transform: 'scale(1.1)'
                    }}
                    transition="all 0.2s"
                  />
                </Tooltip>
              )}
            </HStack>
          </Flex>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default NotificacionCard;

