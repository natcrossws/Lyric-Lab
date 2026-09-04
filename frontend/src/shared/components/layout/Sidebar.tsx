import { keyframes, css } from '@emotion/react';
import {
  Box, VStack, Link, Text, HStack, Flex, Avatar,
  Icon, Image, IconButton
} from '@chakra-ui/react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useInstitution } from '@/core/context/InstitutionContext';
import { isRoleShellFlatPath } from '@/core/theme/documentThemeColor';
import LogoImage from '@/assets/logo.jpeg';
import {
  BiTachometer, BiUser, BiGroup, BiBookAlt, BiTargetLock,
  BiCalendar, BiBook, BiCreditCard, BiCheckCircle, BiBell,
  BiEdit, BiTrophy, BiLogOut, BiBot, BiX, BiBuilding,
  BiCog, BiChevronDown, BiCheck, BiUserCircle, BiChevronRight
} from 'react-icons/bi';
import { Menu, MenuButton, MenuList, MenuItem, Button } from '@chakra-ui/react';

/* ─── Keyframe animations ────────────────────────────────────────────────── */
const blob1 = keyframes`
  0%,100% { transform: translate(0,0)   scale(1);    }
  33%      { transform: translate(30px,-20px) scale(1.08); }
  66%      { transform: translate(-15px,25px) scale(0.94); }
`;
const blob2 = keyframes`
  0%,100% { transform: translate(0,0)   scale(1);    }
  33%      { transform: translate(-25px,20px) scale(1.06); }
  66%      { transform: translate(20px,-18px) scale(0.96); }
`;
const blob3 = keyframes`
  0%,100% { transform: translate(0,0)   scale(1);    }
  50%      { transform: translate(15px,15px) scale(1.1); }
`;
const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-14px); }
  to   { opacity: 1; transform: translateX(0); }
`;
const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
`;

/* ─── Noise texture URL (avoids JSX quote-escaping issues) ─────────────── */
const NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/* ─── Icon map ───────────────────────────────────────────────────────────── */
const iconMap = {
  'Dashboard':            BiTachometer,
  'Usuarios':             BiUser,
  'Gestionar Usuarios':   BiUser,
  'Profesores':           BiGroup,
  'Alumnos':              BiGroup,
  'Tutores':              BiUserCircle,
  'Materias':             BiBookAlt,
  'Asignar Clases':       BiTargetLock,
  'Asignación de Clases': BiTargetLock,
  'Calendario Global':    BiCalendar,
  'Calendario':           BiCalendar,
  'Consultar Bitácoras':  BiBook,
  'Bitácora':             BiBook,
  'Bitácoras':            BiBook,
  'Calendario Pagos':     BiCreditCard,
  'Calendario de Pagos':  BiCreditCard,
  'Validar Pagos':        BiCheckCircle,
  'Pagos':                BiCreditCard,
  'Notificaciones':       BiBell,
  'Mis Alumnos':          BiGroup,
  'Registrar Bitácora':   BiEdit,
  'Mi Calendario':        BiCalendar,
  'Avance (Bitácoras)':   BiBook,
  'Metas':                BiTrophy,
  'Mis Bitácoras':        BiBook,
  'Mis Metas':            BiTrophy,
  'Salones':              BiBuilding,
  'Configuración':        BiCog,
  'Instituciones (plataforma)': BiBuilding,
  'Biblioteca':           BiBookAlt,
  'Boletas IA':           BiBot,
};
const getIconComp = (nombre) => iconMap[nombre] || BiBookAlt;

/* ─── Group links ────────────────────────────────────────────────────────── */
const groupLinks = (links) => {
  const g = { main: [], management: [], calendar: [], reports: [], other: [] };
  links.forEach((link) => {
    const n = link.nombre.toLowerCase();
    if (n.includes('dashboard'))
      g.main.push(link);
    else if (
      n.includes('usuario') || n.includes('profesor') || n.includes('alumno') ||
      n.includes('tutor')   || n.includes('materia')  || n.includes('asignar') ||
      n.includes('salon')   || n.includes('salón')
    ) g.management.push(link);
    else if (n.includes('calendario') || n.includes('pago'))
      g.calendar.push(link);
    else if (n.includes('bitácora') || n.includes('bitacora') || n.includes('avance') || n.includes('meta'))
      g.reports.push(link);
    else
      g.other.push(link);
  });
  return g;
};

const normalizeMenuPath = (path) => (path || '').replace(/\/$/, '') || '/';

const isRoleAreaRootPath = (path) =>
  /^\/(admin|profesor|alumno|padre)$/.test(normalizeMenuPath(path));

/** NavLink con `end` cuando la ruta es índice de un área o prefijo de otras del menú. */
const needsExactNavMatch = (linkPath, allMenuPaths = []) => {
  const p = normalizeMenuPath(linkPath);
  if (isRoleAreaRootPath(p)) return true;
  return allMenuPaths.some((other) => {
    const o = normalizeMenuPath(other);
    return o !== p && o.startsWith(`${p}/`);
  });
};

/* ─── Section Label ─────────────────────────────────────────────────────── */
const SectionLabel = ({ children, delay = 0, roleShellFlat }) => (
  <Text
    fontSize="10px"
    fontWeight="700"
    textTransform="uppercase"
    letterSpacing="1.8px"
    color={roleShellFlat ? 'rgba(255,210,200,0.88)' : 'gray.400'}
    px={3}
    mb="2px"
    mt="2px"
    animation={`${slideIn} 0.4s ${delay}s both ease-out`}
  >
    {children}
  </Text>
);

/* ─── Nav Item ──────────────────────────────────────────────────────────── */
const NavItem = ({ link, index = 0, onClose, roleShellFlat, allMenuPaths = [] }) => {
  const IconComp = getIconComp(link.nombre);
  const delay = `${0.06 + index * 0.035}s`;

  const hoverStyles = roleShellFlat
    ? {
        color: 'white',
        bg: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(244,227,138,0.38)',
        transform: 'translateX(3px)',
        textDecoration: 'none',
        boxShadow: 'inset 3px 0 0 0 rgba(131,153,88,0.4)',
        '& .nav-icon-wrap': {
          bg: 'rgba(255,255,255,0.18)',
          color: 'white',
        },
        '& .nav-arrow': { opacity: 1, transform: 'translateX(0)' },
      }
    : {
        color: 'brand.700',
        bg: 'rgba(var(--brand-rgb), 0.07)',
        border: '1px solid rgba(244,227,138,0.22)',
        transform: 'translateX(3px)',
        textDecoration: 'none',
        '& .nav-icon-wrap': {
          bg: 'rgba(244,227,138,0.14)',
          color: 'brand.600',
        },
        '& .nav-arrow': { opacity: 1, transform: 'translateX(0)' },
      };

  const activeStyles = roleShellFlat
    ? {
        color: 'brand.700',
        fontWeight: '600',
        background: 'white',
        border: '1px solid var(--chakra-colors-secondary-200)',
        boxShadow:
          'inset 5px 0 0 0 var(--chakra-colors-secondary-500), 0 4px 20px rgba(0,0,0,0.16), 0 0 0 1.5px var(--chakra-colors-secondary-100), 0 0 24px var(--chakra-colors-secondary-50)',
        '& .nav-icon-wrap': {
          bg: 'linear-gradient(145deg, rgba(232,237,224,0.9) 0%, rgba(229,240,242,0.85) 38%, rgba(244,227,138,0.22) 100%)',
          color: 'brand.600',
        },
        '& .nav-arrow': { opacity: 0.55, color: 'brand.400', transform: 'translateX(0)' },
        '& .shimmer-line': { opacity: 0 },
      }
    : {
        color: 'white',
        fontWeight: '600',
        background: 'linear-gradient(135deg, var(--chakra-colors-brand-800) 0%, var(--chakra-colors-brand-500) 44%, var(--chakra-colors-brand-600) 82%, #4C3D19 100%)',
        border: '1px solid var(--chakra-colors-secondary-200)',
        boxShadow:
          'inset 5px 0 0 0 var(--chakra-colors-secondary-500), 0 4px 24px rgba(var(--brand-rgb), 0.32), 0 0 0 1.5px var(--chakra-colors-secondary-100), inset 0 1px 0 rgba(255,255,255,0.22)',
        '& .nav-icon-wrap': {
          bg: 'linear-gradient(145deg, rgba(255,255,255,0.22) 0%, rgba(131,153,88,0.22) 52%, rgba(244,227,138,0.18) 100%)',
          color: 'white',
        },
        '& .nav-arrow': { opacity: 0.6, transform: 'translateX(0)' },
        '& .shimmer-line': { opacity: 1 },
      };

  return (
    <Link
      as={NavLink}
      to={link.path}
      end={needsExactNavMatch(link.path, allMenuPaths)}
      display="flex"
      alignItems="center"
      px={3}
      py="9px"
      borderRadius="14px"
      color={roleShellFlat ? 'whiteAlpha.900' : 'gray.600'}
      fontSize="13.5px"
      fontWeight="500"
      mb="2px"
      position="relative"
      overflow="hidden"
      transition="all 0.22s cubic-bezier(0.4,0,0.2,1)"
      animation={`${slideIn} 0.32s ${delay} both ease-out`}
      textDecoration="none !important"
      border="1px solid transparent"
      onClick={onClose}
      _hover={hoverStyles}
      sx={{
        '&.active': activeStyles,
      }}
    >
      {/* Shimmer line on active */}
      <Box
        className="shimmer-line"
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="1px"
        opacity={0}
        bgGradient="linear(90deg, transparent 0%, rgba(131,153,88,0.72) 28%, rgba(244,227,138,0.48) 48%, rgba(var(--brand-rgb), 0.58) 58%, rgba(255,255,255,0.52) 72%, transparent 100%)"
        backgroundSize="200% auto"
        animation={`${shimmer} 2.5s linear infinite`}
        transition="opacity 0.3s"
      />

      <HStack spacing="10px" flex="1">
        {/* Icon bubble */}
        <Box
          className="nav-icon-wrap"
          flexShrink={0}
          w="30px"
          h="30px"
          borderRadius="9px"
          bg={roleShellFlat ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.04)'}
          display="flex"
          alignItems="center"
          justifyContent="center"
          color={roleShellFlat ? 'whiteAlpha.800' : 'gray.500'}
          fontSize="16px"
          transition="all 0.22s ease"
        >
          <Icon as={IconComp} />
        </Box>
        <Text flex="1" noOfLines={1}>{link.nombre}</Text>
      </HStack>

      <Icon
        className="nav-arrow"
        as={BiChevronRight}
        fontSize="14px"
        opacity={0}
        transform="translateX(-4px)"
        transition="all 0.2s ease"
        color={roleShellFlat ? 'whiteAlpha.600' : undefined}
      />
    </Link>
  );
};

/* ─── Institution Header ─────────────────────────────────────────────────── */
const InstitutionHeader = ({ institution, userType, roleShellFlat }) => (
  <Flex align="center" gap={3} flex="1" minW={0}>
    <Box
      w="42px"
      h="42px"
      borderRadius="13px"
      bg="white"
      border={
        roleShellFlat
          ? '1.5px solid rgba(255,255,255,0.35)'
          : '1.5px solid rgba(0,0,0,0.07)'
      }
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      flexShrink={0}
      boxShadow={
        roleShellFlat
          ? '0 2px 12px rgba(0,0,0,0.2), 0 0 0 1px rgba(131,153,88,0.42), 0 0 0 2px rgba(244,227,138,0.26)'
          : '0 2px 12px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(131,153,88,0.18), 0 0 0 2px rgba(244,227,138,0.16)'
      }
    >
      <Image
        src={institution?.theme?.logoBase64 || institution?.logo || LogoImage}
        alt={institution?.nombre || 'Logo'}
        w="100%"
        h="100%"
        objectFit="contain"
      />
    </Box>
    <Box flex="1" minW={0}>
      <Text
        fontSize="14px"
        fontWeight="700"
        color={roleShellFlat ? 'white' : 'gray.800'}
        lineHeight="1.25"
        noOfLines={1}
        letterSpacing="-0.3px"
      >
        {institution?.nombre || 'Panel de Administración'}
      </Text>
      <Text
        fontSize="10px"
        fontWeight="600"
        color={roleShellFlat ? 'whiteAlpha.600' : 'gray.400'}
        textTransform="uppercase"
        letterSpacing="0.8px"
      >
        {userType === 'Administrador' ? 'Global Admin'
          : userType === 'INSTITUTION_ADMIN' ? 'Admin Institucional'
          : userType}
      </Text>
    </Box>
  </Flex>
);

/* ─── Main Sidebar ──────────────────────────────────────────────────────── */
/**
 * @param {'loading'|'database'|'static'} [menuSource] — `database` usa solo `menuModules` (puede ser [] = sidebar vacío); `static` usa `links`.
 * @param {{ nombre: string, path: string }[]} [links] — menú estático (fallback si falla GET /general/menu).
 * @param {{ id_modulo?: number, titulo: string, orden?: number, icono?: string, items: { id_submodulo?: number, nombre: string, path: string, icono?: string, orden?: number }[] }[]} [menuModules]
 */
const Sidebar = ({
  links,
  menuModules = [],
  menuSource = 'static',
  userType,
  userName,
  userPhoto,
  isOpen = true,
  onClose
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const roleShellFlat = isRoleShellFlatPath(pathname);
  const { institution, myInstitutions, switchInstitution } = useInstitution();
  const useDbMenu = menuSource === 'database';
  const showMenuLoading = menuSource === 'loading';
  const grouped = groupLinks(useDbMenu ? [] : (links || []));
  const allMenuPaths = useDbMenu
    ? (menuModules || []).flatMap((mod) => (mod.items || []).map((item) => item.path))
    : (links || []).map((link) => link.path);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Box
      w={{ base: '100%', md: '264px' }}
      h="100vh"
      position="fixed"
      left={isOpen ? '0' : { base: '-100%', md: '-264px' }}
      top="0"
      zIndex={1000}
      transition="left 0.38s cubic-bezier(0.4,0,0.2,1)"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      {...(roleShellFlat
        ? {
            bgGradient: 'linear(to-br, var(--chakra-colors-brand-500) 0%, var(--chakra-colors-brand-600) 48%, var(--chakra-colors-brand-900) 100%)',
            backdropFilter: 'none',
            sx: { WebkitBackdropFilter: 'none' },
            borderRight: '1px solid rgba(255,255,255,0.14)',
            boxShadow:
              '4px 0 28px rgba(0,0,0,0.14), inset 0 -100px 90px -55px rgba(var(--brand-rgb), 0.22), inset -70px 0 90px -55px rgba(244,227,138,0.08)',
          }
        : {
            bg: 'rgba(247,244,213,0.82)',
            backdropFilter: 'blur(36px) saturate(200%) brightness(1.04)',
            sx: { WebkitBackdropFilter: 'blur(36px) saturate(200%) brightness(1.04)' },
            borderRight: '1.5px solid rgba(255,255,255,0.80)',
            boxShadow:
              '8px 0 48px rgba(var(--brand-rgb), 0.10), 2px 0 0 rgba(255,255,255,0.6) inset, inset 0 -80px 70px -50px rgba(244,227,138,0.07), inset -40px 0 70px -42px rgba(76,61,25,0.08)',
          })}
    >

      {/* ── Animated liquid blobs (solo variante cristal) ── */}
      {!roleShellFlat && (
      <Box position="absolute" inset={0} overflow="hidden" zIndex={0} pointerEvents="none">
        {/* Blob 1 – blue */}
        <Box
          position="absolute"
          top="-80px"
          left="-60px"
          w="260px"
          h="260px"
          borderRadius="50%"
          bg="radial-gradient(circle, rgba(131,153,88,0.16) 0%, transparent 70%)"
          filter="blur(32px)"
          animation={`${blob1} 9s ease-in-out infinite`}
        />
        {/* Blob 2 – brand */}
        <Box
          position="absolute"
          top="30%"
          right="-70px"
          w="220px"
          h="220px"
          borderRadius="50%"
          bg="radial-gradient(circle, rgba(var(--brand-rgb), 0.13) 0%, transparent 70%)"
          filter="blur(28px)"
          animation={`${blob2} 11s ease-in-out infinite`}
        />
        {/* Blob 3 – rojo logo */}
        <Box
          position="absolute"
          bottom="-60px"
          left="20%"
          w="200px"
          h="200px"
          borderRadius="50%"
          bg="radial-gradient(circle, rgba(76,61,25,0.18) 0%, rgba(76,61,25,0.06) 48%, transparent 72%)"
          filter="blur(30px)"
          animation={`${blob3} 13s ease-in-out infinite`}
        />
        {/* Blob 4 – naranja logo */}
        <Box
          position="absolute"
          top="8%"
          right="-40px"
          w="160px"
          h="160px"
          borderRadius="50%"
          bg="radial-gradient(circle, rgba(244,227,138,0.14) 0%, rgba(244,227,138,0.04) 45%, transparent 72%)"
          filter="blur(26px)"
          animation={`${blob2} 14s ease-in-out infinite reverse`}
        />
        {/* Specular highlight top edge */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          h="1px"
          bgGradient="linear(90deg, transparent, rgba(255,255,255,0.9) 40%, rgba(255,255,255,0.9) 60%, transparent)"
        />
        {/* Specular highlight left edge */}
        <Box
          position="absolute"
          top={0}
          left={0}
          bottom={0}
          w="1px"
          bgGradient="linear(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.3) 60%, transparent)"
        />
        {/* Inner glass noise texture */}
        <Box
          position="absolute"
          inset={0}
          opacity={0.025}
          bgImage={NOISE_BG}
          bgSize="128px"
        />
      </Box>
      )}

      {/* ═══ HEADER ════════════════════════════════════════════════════════ */}
      <Box
        px={5}
        pt={6}
        pb={4}
        position="relative"
        zIndex={200}
        borderBottom={
          roleShellFlat ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(0,0,0,0.06)'
        }
      >
        {(myInstitutions && myInstitutions.length > 1) ? (
          <Flex align="center" justify="space-between">
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={(
                  <Icon
                    as={BiChevronDown}
                    color={roleShellFlat ? 'whiteAlpha.600' : 'gray.400'}
                    fontSize="15px"
                  />
                )}
                variant="unstyled"
                h="auto"
                p={0}
                display="flex"
                textAlign="left"
                minW={0}
                flex="1"
                _hover={{}}
                _active={{}}
              >
                <InstitutionHeader institution={institution} userType={userType} roleShellFlat={roleShellFlat} />
              </MenuButton>
              <MenuList
                zIndex={1400}
                bg="white"
                border="1px solid rgba(0,0,0,0.10)"
                boxShadow="0 16px 48px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)"
                borderRadius="16px"
                p={2}
                minW="220px"
              >
                <Text px={3} py={2} fontSize="10px" fontWeight="700" color="gray.400" textTransform="uppercase" letterSpacing="1.5px">
                  Cambiar Institución
                </Text>
                {myInstitutions.map((inst) => (
                  <MenuItem
                    key={inst.id}
                    onClick={() => switchInstitution(inst.id)}
                    borderRadius="10px"
                    bg="transparent"
                    color="gray.700"
                    _hover={{ bg: 'brand.50', color: 'brand.700' }}
                    mb="2px"
                    fontWeight={inst.id === institution?.id ? '700' : '500'}
                  >
                    <Flex align="center" justify="space-between" w="full">
                      <Text fontSize="sm">{inst.nombre}</Text>
                      {inst.id === institution?.id && <Icon as={BiCheck} color="brand.500" />}
                    </Flex>
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
            <IconButton
              display={{ base: 'flex', md: 'none' }}
              icon={<Icon as={BiX} />}
              variant="ghost"
              onClick={onClose}
              aria-label="Cerrar"
              size="sm"
              color={roleShellFlat ? 'white' : 'gray.500'}
              ml={2}
              _hover={{ bg: roleShellFlat ? 'whiteAlpha.150' : 'blackAlpha.50' }}
            />
          </Flex>
        ) : (
          <Flex align="center" justify="space-between">
            <InstitutionHeader institution={institution} userType={userType} roleShellFlat={roleShellFlat} />
            <IconButton
              display={{ base: 'flex', md: 'none' }}
              icon={<Icon as={BiX} />}
              variant="ghost"
              onClick={onClose}
              aria-label="Cerrar menú"
              color={roleShellFlat ? 'white' : 'gray.500'}
              ml={2}
              size="sm"
              _hover={{ bg: roleShellFlat ? 'whiteAlpha.150' : 'blackAlpha.50' }}
            />
          </Flex>
        )}
      </Box>

      {/* ═══ NAVIGATION ════════════════════════════════════════════════════ */}
      <Box
        flex="1"
        overflowY="auto"
        px={3}
        py={3}
        position="relative"
        zIndex={1}
        css={{
          '&::-webkit-scrollbar': { width: '3px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: roleShellFlat ? 'rgba(255,255,255,0.22)' : 'rgba(var(--brand-rgb), 0.14)',
            borderRadius: '24px',
          },
        }}
      >
        <VStack align="stretch" spacing={0}>
          {showMenuLoading ? (
            <Text
              px={3}
              py={3}
              fontSize="13px"
              color={roleShellFlat ? 'whiteAlpha.700' : 'gray.500'}
            >
              Cargando menú…
            </Text>
          ) : useDbMenu ? (
            (() => {
              let navIndex = 0;
              return menuModules.map((mod, mi) => (
                <Box key={mod.id_modulo ?? `m-${mi}`} mt={mi === 0 ? 0 : 4}>
                  <SectionLabel delay={0.06 + mi * 0.04} roleShellFlat={roleShellFlat}>
                    {mod.titulo}
                  </SectionLabel>
                  {mod.items.map((item, ii) => {
                    const link = { nombre: item.nombre, path: item.path };
                    const idx = navIndex++;
                    return (
                      <NavItem
                        key={item.id_submodulo != null ? `s-${item.id_submodulo}` : `i-${mi}-${ii}`}
                        link={link}
                        index={idx}
                        onClose={onClose}
                        roleShellFlat={roleShellFlat}
                        allMenuPaths={allMenuPaths}
                      />
                    );
                  })}
                </Box>
              ));
            })()
          ) : (
            <>
              {grouped.main.map((link, i) => (
                <NavItem key={i} link={link} index={i} onClose={onClose} roleShellFlat={roleShellFlat} allMenuPaths={allMenuPaths} />
              ))}

              {grouped.management.length > 0 && (
                <Box mt={4}>
                  <SectionLabel delay={0.08} roleShellFlat={roleShellFlat}>Gestión</SectionLabel>
                  {grouped.management.map((link, i) => (
                    <NavItem key={i} link={link} index={grouped.main.length + i} onClose={onClose} roleShellFlat={roleShellFlat} allMenuPaths={allMenuPaths} />
                  ))}
                </Box>
              )}

              {grouped.calendar.length > 0 && (
                <Box mt={4}>
                  <SectionLabel delay={0.12} roleShellFlat={roleShellFlat}>Calendario</SectionLabel>
                  {grouped.calendar.map((link, i) => (
                    <NavItem key={i} link={link} index={grouped.main.length + grouped.management.length + i} onClose={onClose} roleShellFlat={roleShellFlat} allMenuPaths={allMenuPaths} />
                  ))}
                </Box>
              )}

              {grouped.reports.length > 0 && (
                <Box mt={4}>
                  <SectionLabel delay={0.16} roleShellFlat={roleShellFlat}>Reportes</SectionLabel>
                  {grouped.reports.map((link, i) => (
                    <NavItem key={i} link={link} index={grouped.main.length + grouped.management.length + grouped.calendar.length + i} onClose={onClose} roleShellFlat={roleShellFlat} allMenuPaths={allMenuPaths} />
                  ))}
                </Box>
              )}

              {grouped.other.length > 0 && (
                <Box mt={4}>
                  <SectionLabel delay={0.20} roleShellFlat={roleShellFlat}>Otros</SectionLabel>
                  {grouped.other.map((link, i) => (
                    <NavItem key={i} link={link} index={(links?.length || 0) - grouped.other.length + i} onClose={onClose} roleShellFlat={roleShellFlat} allMenuPaths={allMenuPaths} />
                  ))}
                </Box>
              )}
            </>
          )}
        </VStack>
      </Box>

      {/* ═══ USER FOOTER ════════════════════════════════════════════════════ */}
      <Box
        position="relative"
        zIndex={1}
        px={3}
        pt={3}
        pb={4}
        borderTop={
          roleShellFlat ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(0,0,0,0.06)'
        }
      >
        {/* User card */}
        <Flex
          align="center"
          gap={3}
          p={3}
          mb={2}
          borderRadius="14px"
          bg={roleShellFlat ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.60)'}
          border={
            roleShellFlat
              ? '1px solid rgba(255,255,255,0.2)'
              : '1px solid rgba(0,0,0,0.07)'
          }
          boxShadow={
            roleShellFlat
              ? 'none'
              : '0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)'
          }
          backdropFilter={roleShellFlat ? 'none' : 'blur(8px)'}
        >
          <Avatar
            size="sm"
            name={userName}
            src={userPhoto}
            border={
              roleShellFlat
                ? '2px solid rgba(255,255,255,0.35)'
                : '2px solid rgba(var(--brand-rgb), 0.2)'
            }
            boxShadow={
              roleShellFlat ? '0 0 0 2px rgba(255,255,255,0.12)' : '0 0 0 3px rgba(var(--brand-rgb), 0.08)'
            }
          />
          <Box flex="1" minW={0}>
            <Text
              fontSize="13px"
              fontWeight="600"
              color={roleShellFlat ? 'white' : 'gray.800'}
              noOfLines={1}
            >
              {userName}
            </Text>
            <Text
              fontSize="10px"
              fontWeight="600"
              color={roleShellFlat ? 'whiteAlpha.600' : 'gray.400'}
              textTransform="uppercase"
              letterSpacing="0.5px"
            >
              {userType === 'Administrador' ? 'Global Admin'
                : userType === 'INSTITUTION_ADMIN' ? 'Admin Inst.'
                : userType}
            </Text>
          </Box>
        </Flex>

        {/* Logout */}
        <Box
          as="button"
          w="full"
          display="flex"
          alignItems="center"
          gap={3}
          px={3}
          py="9px"
          borderRadius="14px"
          color={roleShellFlat ? 'red.200' : 'red.500'}
          fontSize="13.5px"
          fontWeight="500"
          transition="all 0.22s ease"
          cursor="pointer"
          border="1px solid transparent"
          bg="transparent"
          onClick={handleLogout}
          _hover={
            roleShellFlat
              ? {
                  bg: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(252,165,165,0.35)',
                  color: 'red.100',
                  transform: 'translateX(2px)',
                }
              : {
                  bg: 'red.50',
                  border: '1px solid rgba(var(--chakra-colors-red-500), 0.12)',
                  color: 'red.600',
                  transform: 'translateX(2px)',
                }
          }
        >
          <Box
            w="30px"
            h="30px"
            borderRadius="9px"
            bg={roleShellFlat ? 'rgba(254,202,202,0.15)' : 'rgba(var(--chakra-colors-red-500), 0.06)'}
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="16px"
            transition="all 0.22s ease"
          >
            <Icon as={BiLogOut} />
          </Box>
          <Text>Cerrar Sesión</Text>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;
