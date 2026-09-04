/**
 * homologate_headers.mjs
 * Replaces the old "gradient Heading + VStack + Actions Bar" pattern
 * with the new liquid-glass hero header + filter glass panel pattern.
 *
 * Usage: node scripts/homologate_headers.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const BASE = resolve(process.cwd(), 'src/modules');

/* ─── Pages config ───────────────────────────────────────────────────────── */
// Each entry: { file, icon, title, subtitle, ctaLabel, ctaHandler, ctaIcon }
// ctaLabel=null → no CTA button in header (already handled elsewhere)
const PAGES = [
  // ── Gestión ──────────────────────────────────────────────────────────────
  {
    file: 'Gestion/pages/GestionAlumnos.jsx',
    icon: 'BiGroup',
    title: 'Gestión de Alumnos',
    subtitle: 'Administra estudiantes mayores de edad y su información. Los menores se registran desde la cuenta del tutor (cupo).',
    ctaLabel: 'Nuevo Alumno',
    ctaHandler: 'handleCrear',
    ctaIcon: 'BiPlus',
    extraButtons: [{ label: 'Exportar a Excel', handler: 'exportarAExcel', icon: 'BiDownload', variant: 'outline', color: 'green' }],
  },
  {
    file: 'Gestion/pages/GestionProfesores.jsx',
    icon: 'BiGroup',
    title: 'Gestión de Profesores',
    subtitle: 'Administra los profesores, su información y especialidades.',
    ctaLabel: 'Nuevo Profesor',
    ctaHandler: 'handleCrear',
    ctaIcon: 'BiPlus',
    extraButtons: [{ label: 'Exportar a Excel', handler: 'exportarAExcel', icon: 'BiDownload', variant: 'outline', color: 'green' }],
  },
  {
    file: 'Gestion/pages/GestionMaterias.jsx',
    icon: 'BiBookAlt',
    title: 'Gestión de Materias',
    subtitle: 'Crea, edita y administra las materias de la escuela.',
    ctaLabel: 'Nueva Materia',
    ctaHandler: 'handleCrear',
    ctaIcon: 'BiPlus',
    extraButtons: [{ label: 'Exportar a Excel', handler: 'exportarAExcel', icon: 'BiDownload', variant: 'outline', color: 'green' }],
  },
  {
    file: 'Gestion/pages/GestionTutores.jsx',
    icon: 'BiUserCircle',
    title: 'Tutores y Padres',
    subtitle: 'Alta con cupo para registro de menores. Los menores los registra el tutor en su cuenta.',
    ctaLabel: 'Nuevo Tutor',
    ctaHandler: 'onCrearOpen',
    ctaIcon: 'BiPlus',
    extraButtons: [],
  },
];

/* ─── Glass style constants ──────────────────────────────────────────────── */
const GLASS_HERO = (icon, title, subtitle, ctaLabel, ctaHandler, ctaIcon, extraButtons = []) => {
  const extraBtns = extraButtons.map(b => `
            <Button
              leftIcon={<Icon as={${b.icon}} />}
              onClick={${b.handler}}
              px={6}
              h="42px"
              borderRadius="12px"
              variant="${b.variant}"
              colorScheme="${b.color}"
              fontWeight="600"
              fontSize="14px"
              transition="all 0.2s ease"
              flexShrink={0}
            >
              ${b.label}
            </Button>`).join('');

  const ctaBtn = ctaLabel ? `
            <Button
              leftIcon={<Icon as={${ctaIcon}} />}
              onClick={${ctaHandler}}
              px={6}
              h="42px"
              borderRadius="12px"
              bg="linear-gradient(135deg, #105666 0%, #0A3323 100%)"
              color="white"
              fontWeight="600"
              fontSize="14px"
              boxShadow="0 4px 16px rgba(16,86,102,0.3)"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(16,86,102,0.38)',
              }}
              transition="all 0.2s ease"
              flexShrink={0}
            >
              ${ctaLabel}
            </Button>` : '';

  return `
        {/* ── Hero header ── */}
        <Box
          mb={6}
          p={6}
          borderRadius="20px"
          bg="rgba(255,255,255,0.72)"
          backdropFilter="blur(24px) saturate(180%)"
          sx={{ WebkitBackdropFilter: 'blur(24px) saturate(180%)' }}
          border="1px solid rgba(255,255,255,0.85)"
          boxShadow="0 4px 24px rgba(16,86,102,0.08), inset 0 1px 0 rgba(255,255,255,0.9)"
          position="relative"
          overflow="hidden"
        >
          <Box position="absolute" top="-40px" right="-30px" w="160px" h="160px"
            bg="radial-gradient(circle, rgba(0,120,255,0.12) 0%, transparent 70%)"
            filter="blur(30px)" pointerEvents="none" />
          <Box position="absolute" bottom="-30px" left="10%" w="140px" h="100px"
            bg="radial-gradient(circle, rgba(16,86,102,0.08) 0%, transparent 70%)"
            filter="blur(25px)" pointerEvents="none" />
          <Flex justify="space-between" align="center" position="relative" zIndex={1}
            flexDir={{ base: 'column', md: 'row' }} gap={4}>
            <VStack align="start" spacing={1}>
              <HStack spacing={3}>
                <Box
                  w="40px" h="40px" borderRadius="12px"
                  bg="linear-gradient(135deg, #105666 0%, #0A3323 100%)"
                  display="flex" alignItems="center" justifyContent="center"
                  boxShadow="0 4px 14px rgba(16,86,102,0.3)"
                >
                  <Icon as={${icon}} color="white" fontSize="20px" />
                </Box>
                <Heading size="lg" color="gray.800" fontWeight="800" letterSpacing="-0.5px">
                  ${title}
                </Heading>
              </HStack>
              <Text fontSize="sm" color="gray.500" pl="52px">
                ${subtitle}
              </Text>
            </VStack>
            <HStack spacing={3} flexShrink={0}>${extraBtns}${ctaBtn}
            </HStack>
          </Flex>
        </Box>`;
};

const GLASS_INPUT_PROPS = `
              bg="rgba(255,255,255,0.8)"
              border="1px solid rgba(0,0,0,0.08)"
              borderRadius="10px"
              boxShadow="0 1px 4px rgba(0,0,0,0.04)"
              _focus={{
                bg: 'white',
                border: '1.5px solid rgba(16,86,102,0.35)',
                boxShadow: '0 0 0 3px rgba(16,86,102,0.08)',
              }}
              _hover={{ border: '1px solid rgba(0,0,0,0.14)' }}
              fontSize="13.5px"
              h="40px"`;

/* ─── Transform function ─────────────────────────────────────────────────── */
function transformFile(cfg) {
  const filePath = resolve(BASE, cfg.file);
  let src = readFileSync(filePath, 'utf8');
  const original = src;

  // 1. Remove old gradient Heading VStack block
  src = src.replace(
    /<VStack align="start" spacing=\{2\} mb=\{8\}>\s*<Heading size="lg"[^>]*bgGradient[^>]*bgClip="text"[^>]*>[\s\S]*?<\/VStack>/,
    ''
  );

  // 2. Replace <Box animation="fadeIn 0.5s"> outer with plain <Box>
  src = src.replace(/<Box animation="fadeIn 0\.5s">/, '<Box>');

  // 3. Replace old VStack Actions Bar + all old-style inputs/selects/buttons inside with glass panel placeholder
  // We mark the old Actions Bar VStack for replacement
  src = src.replace(
    /\{\/\* Actions Bar \*\/\}\s*(\{\/\* Actions Bar \*\/\}\s*)?<VStack spacing=\{4\} align="stretch" mb=\{6\}>([\s\S]*?)<\/VStack>/,
    (match, _, inner) => {
      // Build glass filter panel reusing the inner content but with glass styles on inputs/selects
      const glassedInner = inner
        .replace(/bg="white"\s*borderRadius="full"\s*boxShadow="sm"/g, GLASS_INPUT_PROPS.trim())
        .replace(/<Flex justify="flex-end"[^>]*>[\s\S]*?<\/Flex>/g, ''); // Remove old button flex

      return `{/* ── Filters glass panel ── */}
        <Box
          mb={6}
          p={4}
          borderRadius="16px"
          bg="rgba(255,255,255,0.65)"
          backdropFilter="blur(20px) saturate(160%)"
          sx={{ WebkitBackdropFilter: 'blur(20px) saturate(160%)' }}
          border="1px solid rgba(255,255,255,0.80)"
          boxShadow="0 2px 16px rgba(16,86,102,0.06), inset 0 1px 0 rgba(255,255,255,0.85)"
        >${glassedInner}        </Box>`;
    }
  );

  // 4. Inject hero header right after the opening <Box> of the return
  src = src.replace(
    /return \(\s*<>\s*<Box>/,
    `return (\n    <>\n      <Box>\n${GLASS_HERO(cfg.icon, cfg.title, cfg.subtitle, cfg.ctaLabel, cfg.ctaHandler, cfg.ctaIcon, cfg.extraButtons)}`
  );

  if (src !== original) {
    writeFileSync(filePath, src, 'utf8');
    console.log(`✅ Updated: ${cfg.file}`);
  } else {
    console.log(`⚠️  No changes: ${cfg.file} (pattern may differ)`);
  }
}

PAGES.forEach(transformFile);
console.log('\nDone!');
