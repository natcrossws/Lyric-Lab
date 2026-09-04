import { keyframes } from '@emotion/react';
import { Box, Flex, HStack, Heading, Text, Button, Icon, Avatar, Image } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBreakpointValue } from '@chakra-ui/react';
import { FiMenu, FiBell } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { Link } from '@chakra-ui/react';
import api from '@/shared/services/api';
import Sidebar from './Sidebar';
import PasskeyPromoBanner from '../overlays/PasskeyPromoBanner';
import { isLinkAllowedByPlanPaths, getStaticExtrasForRole } from '@/shared/utils/menuEntitlements';
import { isRoleShellFlatPath } from '@/core/theme/documentThemeColor';
import kePlayasLogo from '@/assets/logo.png';
import { useInstitution } from '@/core/context/InstitutionContext';

/* ─── Topbar blob animations ────────────────────────────────────────── */
const navBlob1 = keyframes`
  0%,100% { transform: translate(0,0) scale(1); }
  50%      { transform: translate(20px,8px) scale(1.06); }
`;
const navBlob2 = keyframes`
  0%,100% { transform: translate(0,0) scale(1); }
  50%      { transform: translate(-18px,-6px) scale(1.04); }
`;
const bellRing = keyframes`
  0%,100% { transform: rotate(0deg); }
  15%      { transform: rotate(12deg); }
  30%      { transform: rotate(-10deg); }
  45%      { transform: rotate(8deg); }
  60%      { transform: rotate(0deg); }
`;

/** Roles que consumen menú desde GET /general/menu (permisos por usuario en BD). Incluye GLOBAL_ADMIN (mismo prefijo /admin). */
const PLAN_MENU_ROLES = ['ADMIN', 'GLOBAL_ADMIN', 'INSTITUTION_ADMIN', 'PROFESOR', 'PADRE', 'ALUMNO'];

const Layout = ({ links, userType, userName: userNameProp, userPhoto: userPhotoProp, children }) => {
  const getStoredUser = () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Error reading user from localStorage:', error);
    }
    return null;
  };

  const storedUser = getStoredUser();
  const userName = userNameProp || storedUser?.nombre || 'Usuario';
  const userPhoto = userPhotoProp || storedUser?.foto_url;
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [planPaths, setPlanPaths] = useState(null);
  /**
   * Menú desde BD: `status` database + `modules` [] = sidebar vacío (sin rel_usuario_submodulo).
   * `static_fallback` solo si falla la petición (red); no cuando el API devuelve modules vacío.
   */
  const [sidebarMenu, setSidebarMenu] = useState({
    status: 'idle',
    modules: []
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { institution } = useInstitution();
  
  const logoSrc = institution?.theme?.logoBase64 || institution?.logo || kePlayasLogo;

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = storedUser?.role;
    if (!token || !role || !PLAN_MENU_ROLES.includes(role)) {
      setPlanPaths(null);
      return undefined;
    }
    let cancelled = false;
    api.get('/general/entitlements')
      .then((res) => {
        if (cancelled || !res.data?.success) return;
        const paths = Array.isArray(res.data.paths) ? res.data.paths : null;
        setPlanPaths(paths);
      })
      .catch(() => {
        if (!cancelled) setPlanPaths(null);
      });
    return () => { cancelled = true; };
  }, [storedUser?.role, storedUser?.fk_id_institucion]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = storedUser?.role;
    if (!token || !role || !PLAN_MENU_ROLES.includes(role)) {
      setSidebarMenu({ status: 'static_fallback', modules: [] });
      return undefined;
    }
    let cancelled = false;
    setSidebarMenu({ status: 'loading', modules: [] });
    api.get('/general/menu')
      .then((res) => {
        if (cancelled || !res.data?.success || !Array.isArray(res.data.modules)) return;
        let mods = res.data.modules;
        mods = mods
          .map((m) => ({
            ...m,
            items: (m.items || []).filter((item) => {
              if (
                storedUser?.role === 'ALUMNO'
                && storedUser?.hasTutores
                && (item.nombre === 'Pagos' || item.nombre === 'Calendario Pagos')
              ) {
                return false;
              }
              return true;
            })
          }))
          .filter((m) => (m.items || []).length > 0);
        setSidebarMenu({ status: 'database', modules: mods });
      })
      .catch(() => {
        if (!cancelled) setSidebarMenu({ status: 'static_fallback', modules: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [storedUser?.role, storedUser?.hasTutores, storedUser?.fk_id_institucion]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // Notifications removed

  const role = storedUser?.role;
  const applyPlanPaths =
    role &&
    PLAN_MENU_ROLES.includes(role) &&
    Array.isArray(planPaths) &&
    planPaths.length > 0;

  const staticExtrasForRole = getStaticExtrasForRole(role);

  const isRoleShellFlatTop = isRoleShellFlatPath(location.pathname);

  // Filtrar links: tutores + menú según plan/suscripción (rutas por rol desde API)
  const filteredLinks = links ? links.filter((link) => {
      if (storedUser?.role === 'ALUMNO' && storedUser?.hasTutores && (link.nombre === 'Pagos' || link.nombre === 'Calendario Pagos')) {
          return false;
      }
      if (applyPlanPaths && !isLinkAllowedByPlanPaths(link, planPaths, staticExtrasForRole)) {
          return false;
      }
      return true;
  }) : [];

  const normPath = (p) => (p || '').replace(/\/$/, '') || '/';

  // Determinar título de la página basado en la ruta (menú DB o estático)
  const getPageTitle = () => {
    const loc = normPath(location.pathname);
    if (sidebarMenu.status === 'database') {
      for (const m of sidebarMenu.modules) {
        for (const item of m.items || []) {
          if (normPath(item.path) === loc) return item.nombre;
        }
      }
    }
    const pool = filteredLinks.length ? filteredLinks : (links || []);
    const currentLink = pool.find((link) => normPath(link.path) === loc);
    return currentLink?.nombre || 'Dashboard';
  };

  const sidebarMenuSource =
    sidebarMenu.status === 'loading'
      ? 'loading'
      : sidebarMenu.status === 'database'
        ? 'database'
        : sidebarMenu.status === 'idle' && role && PLAN_MENU_ROLES.includes(role)
          ? 'loading'
          : 'static';

  return (
    <Box minH="100vh" bg="var(--chakra-colors-bg-main)" position="relative">
      {/* Passkey Promo Banner */}
      <PasskeyPromoBanner />
      
      {/* Removed Global Background Gradient Mesh to keep pure background color */}

      <Sidebar
        menuSource={sidebarMenuSource}
        menuModules={sidebarMenu.modules}
        links={filteredLinks}
        userType={userType}
        userName={userName}
        userPhoto={userPhoto}
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
      />

      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <Box
          position="fixed"
          inset={0}
          zIndex={999}
          bg="rgba(0,0,0,0.55)"
          backdropFilter="blur(4px)"
          onClick={handleSidebarClose}
          transition="opacity 0.3s"
        />
      )}

      <Box
        ml={isSidebarOpen && !isMobile ? "260px" : "0"}
        w={isSidebarOpen && !isMobile ? "calc(100% - 260px)" : "100%"}
        minH="100vh"
        transition="all 0.3s ease-in-out"
        position="relative"
        zIndex={1}
      >
        {/* ╌╌╌ Topbar ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ */}
        <Box
          px={{ base: 4, md: 6 }}
          py={3}
          position="sticky"
          top="0"
          zIndex={100}
          overflow="hidden"
          {...(isRoleShellFlatTop
            ? {
                bgGradient: 'linear(to-r, brand.600 0%, brand.500 40%, brand.500 60%, brand.600 100%)',
                backdropFilter: 'none',
                sx: { WebkitBackdropFilter: 'none' },
                borderBottom: '1px solid',
                borderColor: 'rgba(255,255,255,0.14)',
                boxShadow:
                  'inset 0 -1px 0 rgba(255,255,255,0.1), inset 0 -6px 18px -4px rgba(var(--brand-rgb), 0.28)',
              }
            : {
                bg: 'rgba(var(--brand-rgb), 0.9)',
                backdropFilter: 'blur(16px) saturate(180%)',
                sx: { WebkitBackdropFilter: 'blur(16px) saturate(180%)' },
                borderBottom: '1px solid rgba(0,0,0,0.1)',
                boxShadow:
                  '0 1px 0 rgba(255,255,255,0.2) inset, 0 4px 24px rgba(var(--brand-rgb), 0.2)',
              })}
          transition="all 0.2s ease-in-out"
        >
          {/* Blobs (solo variante cristal) */}
          {!isRoleShellFlatTop && (
          <Box position="absolute" inset={0} pointerEvents="none" overflow="hidden">
            <Box
              position="absolute" top="-40px" left="10%"
              w="180px" h="80px" borderRadius="50%"
              bg="radial-gradient(circle, rgba(131,153,88,0.14) 0%, transparent 70%)"
              filter="blur(24px)"
              animation={`${navBlob1} 8s ease-in-out infinite`}
            />
            <Box
              position="absolute" top="-30px" right="8%"
              w="160px" h="70px" borderRadius="50%"
              bg="radial-gradient(circle, rgba(var(--brand-rgb), 0.11) 0%, transparent 70%)"
              filter="blur(20px)"
              animation={`${navBlob2} 10s ease-in-out infinite`}
            />
            <Box
              position="absolute" bottom="-28px" left="18%"
              w="200px" h="72px" borderRadius="50%"
              bg="radial-gradient(circle, rgba(244,227,138,0.16) 0%, rgba(76,61,25,0.06) 42%, transparent 72%)"
              filter="blur(22px)"
              animation={`${navBlob1} 11s ease-in-out infinite reverse`}
            />
            {/* Specular highlight — bottom edge */}
            <Box
              position="absolute" bottom={0} left={0} right={0} h="1px"
              bgGradient="linear(90deg, transparent, rgba(255,255,255,0.8) 40%, rgba(255,255,255,0.8) 60%, transparent)"
            />
            {/* Specular highlight — top edge */}
            <Box
              position="absolute" top={0} left={0} right={0} h="1px"
              bgGradient="linear(90deg, transparent, rgba(255,255,255,0.9) 30%, rgba(255,255,255,0.9) 70%, transparent)"
            />
          </Box>
          )}

          <Flex justify="space-between" align="center" position="relative" zIndex={1} minH={{ base: '48px', md: '52px' }}>
            {/* Left — hamburger + title */}
            <HStack spacing={3} position="relative" zIndex={2}>
              <Box
                as="button"
                onClick={toggleSidebar}
                w="38px" h="38px"
                borderRadius="11px"
                display="flex" alignItems="center" justifyContent="center"
                fontSize="20px"
                color="white"
                bg="rgba(255,255,255,0.14)"
                border="1px solid rgba(255,255,255,0.22)"
                boxShadow="none"
                transition="all 0.2s ease"
                cursor="pointer"
                aria-label="Toggle Sidebar"
                _hover={{
                  bg: 'rgba(255,255,255,0.24)',
                  boxShadow: 'none',
                  color: 'white',
                  transform: 'scale(1.05)',
                }}
              >
                <Icon as={FiMenu} />
              </Box>

              <Box>
                <Heading
                  fontSize={{ base: '18px', md: '22px' }}
                  fontWeight="700"
                  color="white"
                  letterSpacing="-0.5px"
                  lineHeight="1"
                >
                  {getPageTitle()}
                </Heading>
              </Box>
            </HStack>

            <Box
              position="absolute"
              left="50%"
              top="50%"
              transform="translate(-50%, -50%)"
              zIndex={1}
              pointerEvents="none"
              px={{ base: 3, sm: 4, md: 5 }}
              py={{ base: 2, md: 2.5 }}
              borderRadius="2xl"
              bg={isRoleShellFlatTop ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.88)'}
              backdropFilter="blur(12px) saturate(160%)"
              sx={{ WebkitBackdropFilter: 'blur(12px) saturate(160%)' }}
              border="1px solid"
              borderColor={isRoleShellFlatTop ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.95)'}
              boxShadow={
                isRoleShellFlatTop
                  ? '0 10px 32px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,1)'
                  : '0 8px 26px rgba(var(--brand-rgb), 0.14), inset 0 1px 0 rgba(255,255,255,1)'
              }
            >
              <Image
                src={logoSrc}
                alt="KePlayas"
                h={{ base: '28px', sm: '34px', md: '42px' }}
                maxW={{ base: 'min(52vw, 200px)', sm: '220px', md: '280px' }}
                w="auto"
                objectFit="contain"
                display="block"
                sx={{
                  filter: isRoleShellFlatTop
                    ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))'
                    : 'drop-shadow(0 1px 2px rgba(var(--brand-rgb), 0.08))',
                }}
              />
            </Box>

            {/* Right — actions */}
            <HStack spacing={2} position="relative" zIndex={2}>
              {/* Bell removed */}

              {/* User avatar pill */}
              <Flex
                align="center"
                gap={2}
                px={3}
                h="38px"
                borderRadius="11px"
                bg="rgba(255,255,255,0.14)"
                border="1px solid rgba(255,255,255,0.22)"
                boxShadow="none"
                display={{ base: 'none', md: 'flex' }}
              >
                <Avatar
                  size="xs"
                  name={userName}
                  src={userPhoto}
                  border={
                    isRoleShellFlatTop
                      ? '1.5px solid rgba(255,255,255,0.35)'
                      : '1.5px solid rgba(var(--brand-rgb), 0.18)'
                  }
                />
                <Text
                  fontSize="12.5px"
                  fontWeight="600"
                  color="white"
                  noOfLines={1}
                  maxW="120px"
                >
                  {userName}
                </Text>
              </Flex>
            </HStack>
          </Flex>
          <Box
            position="absolute"
            left={0}
            right={0}
            bottom={0}
            h={isRoleShellFlatTop ? '3px' : '2px'}
            pointerEvents="none"
            zIndex={2}
            bgGradient={
              isRoleShellFlatTop
                ? 'linear(to-r, transparent 2%, rgba(255,255,255,0.2) 28%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.2) 72%, transparent 98%)'
                : 'linear(to-r, transparent 6%, rgba(var(--brand-rgb), 0.2) 36%, rgba(var(--brand-rgb), 0.5) 50%, rgba(var(--brand-rgb), 0.2) 64%, transparent 94%)'
            }
            opacity={isRoleShellFlatTop ? 1 : 0.92}
          />
        </Box>

        {/* Content */}
        <Box p={8} pb={0} minH="calc(100vh - 80px)" display="flex" flexDirection="column">
          <Box flex="1">
            {children}
          </Box>

          {/* Footer */}
          <Box
            mt={8}
            py={4}
            borderTop="1px solid"
            borderColor="rgba(0,0,0,0.05)"
            textAlign="center"
          >
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;

