import React from 'react';
import { keyframes } from '@emotion/react';
import { Box, Icon } from '@chakra-ui/react';
import {
  BiMusic,
  BiPencil,
  BiEdit,
  BiBookOpen,
  BiBook,
  BiLaptop,
  BiDesktop,
  BiFile,
  BiBrush,
  BiPalette,
  BiChalkboard,
  BiSpreadsheet,
} from 'react-icons/bi';
import { FaGuitar, FaLeaf } from 'react-icons/fa';

/* ─────────────── Keyframes ─────────────── */

const meshShift = keyframes`
  0%   { opacity: 1; transform: scale(1) translate(0, 0); }
  50%  { opacity: 0.92; transform: scale(1.04) translate(2%, -1%); }
  100% { opacity: 1; transform: scale(1) translate(0, 0); }
`;
const orbDriftA = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  40%       { transform: translate(6vw, -4vh) scale(1.08); }
  70%       { transform: translate(-4vw, 3vh) scale(0.96); }
`;
const orbDriftB = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  45%       { transform: translate(-5vw, 5vh) scale(1.06); }
  75%       { transform: translate(4vw, -3vh) scale(0.94); }
`;
const iconDrift = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) rotate(-5deg); opacity: 0.28; }
  33%       { transform: translate3d(10px, -14px, 0) rotate(6deg); opacity: 0.50; }
  66%       { transform: translate3d(-8px, 10px, 0) rotate(-3deg); opacity: 0.38; }
`;

/* Traslación horizontal continua */
const waveSlide = keyframes`
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

/* Pulso suave de brillo */
const shimmerPulse = keyframes`
  0%, 100% { opacity: 0.12; }
  50%       { opacity: 0.28; }
`;

/* ─────────────── Iconos flotantes ─────────────── */

const FLOATING = [
  { Cmp: BiMusic,       top: '7%',  left: '5%',  size: 7, dur: '16s', delay: '0s',   color: 'rgba(255,255,255,0.22)' },
  { Cmp: BiPencil,      top: '22%', left: '12%', size: 6, dur: '19s', delay: '0.8s', color: 'rgba(244,227,138,0.38)' },
  { Cmp: BiEdit,        top: '14%', left: '78%', size: 6, dur: '17s', delay: '1.4s', color: 'rgba(255,255,255,0.18)' },
  { Cmp: FaGuitar,      top: '18%', left: '88%', size: 7, dur: '21s', delay: '0.3s', color: 'rgba(244,227,138,0.42)' },
  { Cmp: BiBookOpen,    top: '42%', left: '4%',  size: 8, dur: '18s', delay: '2s',   color: 'rgba(255,255,255,0.16)' },
  { Cmp: BiBook,        top: '38%', left: '92%', size: 7, dur: '20s', delay: '1.1s', color: 'rgba(232,237,224,0.32)' },
  { Cmp: BiLaptop,      top: '58%', left: '8%',  size: 8, dur: '22s', delay: '0.5s', color: 'rgba(255,255,255,0.18)' },
  { Cmp: BiDesktop,     top: '52%', left: '86%', size: 7, dur: '19s', delay: '1.8s', color: 'rgba(131,153,88,0.32)' },
  { Cmp: BiFile,        top: '68%', left: '14%', size: 6, dur: '17s', delay: '2.4s', color: 'rgba(255,255,255,0.14)' },
  { Cmp: BiBrush,       top: '72%', left: '80%', size: 7, dur: '20s', delay: '0.2s', color: 'rgba(244,227,138,0.34)' },
  { Cmp: BiPalette,     top: '12%', left: '44%', size: 6, dur: '23s', delay: '1.6s', color: 'rgba(76,61,25,0.28)' },
  { Cmp: BiChalkboard,  top: '48%', left: '48%', size: 9, dur: '24s', delay: '0.9s', color: 'rgba(255,255,255,0.12)' },
  { Cmp: FaLeaf,        top: '82%', left: '22%', size: 6, dur: '18s', delay: '2.1s', color: 'rgba(131,153,88,0.42)' },
  { Cmp: BiSpreadsheet, top: '78%', left: '72%', size: 6, dur: '19s', delay: '1.3s', color: 'rgba(255,255,255,0.16)' },
  { Cmp: BiMusic,       top: '30%', left: '52%', size: 5, dur: '15s', delay: '3s',   color: 'rgba(var(--brand-rgb), 0.28)' },
];

/* ─────────────── Paths SVG sin costura ─────────────────────────────────────
 *
 *  Para que NO haya costura visible la ola debe ser PERIÓDICA:
 *  el valor Y en x=0 debe ser idéntico al valor Y en x=2400,
 *  y las tangentes deben coincidir también.
 *
 *  Cada path usa N crestas simétricas de período = 2400/N.
 *  Estructura: M0,y  C cp1x,y-A  cp2x,y+A  Px,y  …  L2400,220  L0,220 Z
 *
 * ─────────────────────────────────────────────────────────────────────────── */

// 4 períodos de 600 — amplitud 55px — base y=85
const WAVE_DEEP =
  'M0,85 ' +
  'C150,30 450,140 600,85 ' +
  'C750,30 1050,140 1200,85 ' +
  'C1350,30 1650,140 1800,85 ' +
  'C1950,30 2250,140 2400,85 ' +
  'L2400,220 L0,220 Z';

// 3 períodos de 800 — amplitud 48px — base y=100
const WAVE_MID =
  'M0,100 ' +
  'C200,52 600,148 800,100 ' +
  'C1000,52 1400,148 1600,100 ' +
  'C1800,52 2200,148 2400,100 ' +
  'L2400,220 L0,220 Z';

// 5 períodos de 480 — amplitud 36px — base y=118
const WAVE_ACCENT =
  'M0,118 ' +
  'C120,82 360,154 480,118 ' +
  'C600,82 840,154 960,118 ' +
  'C1080,82 1320,154 1440,118 ' +
  'C1560,82 1800,154 1920,118 ' +
  'C2040,82 2280,154 2400,118 ' +
  'L2400,220 L0,220 Z';

// 6 períodos de 400 — amplitud 18px — base y=138 (espuma sutil)
const WAVE_FOAM =
  'M0,138 ' +
  'C100,120 300,156 400,138 ' +
  'C500,120 700,156 800,138 ' +
  'C900,120 1100,156 1200,138 ' +
  'C1300,120 1500,156 1600,138 ' +
  'C1700,120 1900,156 2000,138 ' +
  'C2100,120 2300,156 2400,138 ' +
  'L2400,220 L0,220 Z';

// 8 períodos de 300 — amplitud 8px — base y=155 (destello superficial)
const WAVE_GLINT =
  'M0,155 ' +
  'C75,147 225,163 300,155 ' +
  'C375,147 525,163 600,155 ' +
  'C675,147 825,163 900,155 ' +
  'C975,147 1125,163 1200,155 ' +
  'C1275,147 1425,163 1500,155 ' +
  'C1575,147 1725,163 1800,155 ' +
  'C1875,147 2025,163 2100,155 ' +
  'C2175,147 2325,163 2400,155 ' +
  'L2400,220 L0,220 Z';

/* ─────────────── Componente de ondas ─────────────── */

function LoginWaves() {
  const rid = React.useId().replace(/:/g, '');
  const gDeep   = `wDeep_${rid}`;
  const gMid    = `wMid_${rid}`;
  const gAccent = `wAccent_${rid}`;
  const gFoam   = `wFoam_${rid}`;
  const gGlint  = `wGlint_${rid}`;

  return (
    <Box
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      h={{ base: '140px', md: '190px' }}
      overflow="hidden"
      pointerEvents="none"
      zIndex={1}
      lineHeight={0}
    >

      {/* ── Capa 1: Ola profunda — azul oscuro, más lenta ── */}
      <Box
        position="absolute"
        bottom="-2px"
        left={0}
        w="200%"
        h="100%"
        opacity={0.80}
        sx={{ animation: `${waveSlide} 28s linear infinite` }}
      >
        <Box as="svg" viewBox="0 0 4800 220" width="100%" height="220px" display="block" preserveAspectRatio="none">
          <defs>
            {/* Gradiente vertical: más oscuro abajo para dar profundidad */}
            <linearGradient id={gDeep} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="var(--chakra-colors-brand-800)" stopOpacity="0.70" />
              <stop offset="60%"  stopColor="var(--chakra-colors-brand-500)" stopOpacity="0.85" />
              <stop offset="100%" stopColor="var(--chakra-colors-brand-900)" stopOpacity="0.95" />
            </linearGradient>
          </defs>
          <path fill={`url(#${gDeep})`} d={WAVE_DEEP} />
          <path fill={`url(#${gDeep})`} d={WAVE_DEEP} transform="translate(2400,0)" />
        </Box>
      </Box>

      {/* ── Capa 2: Ola media — paleta completa, dirección contraria ── */}
      <Box
        position="absolute"
        bottom="-2px"
        left={0}
        w="200%"
        h="96%"
        opacity={0.50}
        sx={{ animation: `${waveSlide} 22s linear infinite reverse`, animationDelay: '-6s' }}
      >
        <Box as="svg" viewBox="0 0 4800 220" width="100%" height="220px" display="block" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gMid} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="var(--chakra-colors-brand-500)" stopOpacity="0.65" />
              <stop offset="40%"  stopColor="#0A3323" stopOpacity="0.50" />
              <stop offset="70%"  stopColor="#839958" stopOpacity="0.42" />
              <stop offset="100%" stopColor="var(--chakra-colors-brand-500)" stopOpacity="0.55" />
            </linearGradient>
          </defs>
          <path fill={`url(#${gMid})`} d={WAVE_MID} />
          <path fill={`url(#${gMid})`} d={WAVE_MID} transform="translate(2400,0)" />
        </Box>
      </Box>

      {/* ── Capa 3: Ola de acento — naranja/rojo suave ── */}
      <Box
        position="absolute"
        bottom="-2px"
        left={0}
        w="200%"
        h="88%"
        opacity={0.32}
        sx={{ animation: `${waveSlide} 16s linear infinite`, animationDelay: '-4s' }}
      >
        <Box as="svg" viewBox="0 0 4800 220" width="100%" height="220px" display="block" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gAccent} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#4C3D19" stopOpacity="0.50" />
              <stop offset="50%"  stopColor="#F4E38A" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#839958" stopOpacity="0.48" />
            </linearGradient>
          </defs>
          <path fill={`url(#${gAccent})`} d={WAVE_ACCENT} />
          <path fill={`url(#${gAccent})`} d={WAVE_ACCENT} transform="translate(2400,0)" />
        </Box>
      </Box>

      {/* ── Capa 4: Espuma — muy sutil, azul-blanco ── */}
      <Box
        position="absolute"
        bottom="-2px"
        left={0}
        w="200%"
        h="78%"
        opacity={0.22}
        sx={{ animation: `${waveSlide} 12s linear infinite reverse`, animationDelay: '-2s' }}
      >
        <Box
          as="svg"
          viewBox="0 0 4800 220"
          width="100%"
          height="220px"
          display="block"
          preserveAspectRatio="none"
          sx={{ animation: `${shimmerPulse} 6s ease-in-out infinite` }}
        >
          <defs>
            <linearGradient id={gFoam} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#c8d4ce" stopOpacity="0.55" />
              <stop offset="50%"  stopColor="#e8ebe4" stopOpacity="0.78" />
              <stop offset="100%" stopColor="#b8c9bf" stopOpacity="0.52" />
            </linearGradient>
          </defs>
          <path fill={`url(#${gFoam})`} d={WAVE_FOAM} />
          <path fill={`url(#${gFoam})`} d={WAVE_FOAM} transform="translate(2400,0)" />
        </Box>
      </Box>

      {/* ── Capa 5: Destello superficial — naranja muy tenue ── */}
      <Box
        position="absolute"
        bottom="-2px"
        left={0}
        w="200%"
        h="66%"
        sx={{ animation: `${waveSlide} 9s linear infinite`, animationDelay: '-1s' }}
      >
        <Box
          as="svg"
          viewBox="0 0 4800 220"
          width="100%"
          height="220px"
          display="block"
          preserveAspectRatio="none"
          sx={{ animation: `${shimmerPulse} 4s ease-in-out infinite` }}
        >
          <defs>
            <linearGradient id={gGlint} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#F4E38A" stopOpacity="0.22" />
              <stop offset="50%"  stopColor="#ffffff" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#F4E38A" stopOpacity="0.14" />
            </linearGradient>
          </defs>
          <path fill={`url(#${gGlint})`} d={WAVE_GLINT} />
          <path fill={`url(#${gGlint})`} d={WAVE_GLINT} transform="translate(2400,0)" />
        </Box>
      </Box>

    </Box>
  );
}

/* ─────────────── Fondo completo ─────────────── */

/**
 * Fondo animado para login: paleta Margarita Beach (§8.5 guía — petróleo var(--chakra-colors-brand-500), bosque #0A3323, crema/oliva).
 * Ondas de 5 capas sin costura visible, opacidades reducidas para armonizar con fondo oscuro.
 */
const LoginAnimatedBackground = () => (
  <Box
    position="absolute"
    inset={0}
    zIndex={0}
    overflow="hidden"
    bg="var(--chakra-colors-brand-900)"
    sx={{
      '@media (prefers-reduced-motion: reduce)': {
        '& *': { animation: 'none !important' },
      },
    }}
  >
    {/* Base — degradado bosque / petróleo */}
    <Box
      position="absolute"
      inset={0}
      bgGradient="linear(to-br, var(--chakra-colors-brand-900) 0%, var(--chakra-colors-brand-800) 12%, #0A3323 34%, var(--chakra-colors-brand-500) 52%, var(--chakra-colors-brand-600) 72%, #0A3323 90%, #04140e 100%)"
    />
    {/* Capa cálida (crema / tierra) animada */}
    <Box
      position="absolute"
      inset={0}
      bgGradient="linear(to-tr, rgba(76,61,25,0.18) 0%, transparent 32%, transparent 68%, rgba(244,227,138,0.14) 100%)"
      animation={`${meshShift} 18s ease-in-out infinite`}
    />

    <LoginWaves />

    {/* Orbe petróleo superior-izquierdo */}
    <Box
      position="absolute"
      top="-15%"
      left="-8%"
      w="55vw" h="55vw"
      maxW="520px" maxH="520px"
      borderRadius="full"
      bg="radial-gradient(circle, rgba(var(--brand-rgb), 0.38) 0%, rgba(10,51,35,0.26) 42%, rgba(244,227,138,0.08) 55%, transparent 72%)"
      filter="blur(48px)"
      animation={`${orbDriftA} 22s ease-in-out infinite`}
    />
    {/* Orbe oliva / tierra inferior-derecho */}
    <Box
      position="absolute"
      bottom="-18%" right="-10%"
      w="60vw" h="50vw"
      maxW="560px" maxH="480px"
      borderRadius="full"
      bg="radial-gradient(circle, rgba(131,153,88,0.26) 0%, rgba(76,61,25,0.14) 40%, transparent 68%)"
      filter="blur(52px)"
      animation={`${orbDriftB} 26s ease-in-out infinite`}
    />
    {/* Orbe crema central-derecho */}
    <Box
      position="absolute"
      top="35%" right="5%"
      w="40vw" h="40vw"
      maxW="380px" maxH="380px"
      borderRadius="full"
      bg="radial-gradient(circle, rgba(244,227,138,0.20) 0%, transparent 65%)"
      filter="blur(40px)"
      animation={`${orbDriftA} 28s ease-in-out infinite reverse`}
    />

    {/* Viñeta bordes */}
    <Box
      position="absolute"
      inset={0}
      bgGradient="radial(circle at 50% 45%, transparent 0%, rgba(5,24,17,0.38) 100%)"
      pointerEvents="none"
    />

    {/* Iconitos flotantes */}
    {FLOATING.map(({ Cmp, top, left, size, dur, delay, color }, i) => (
      <Box
        key={`${i}-${top}-${left}`}
        position="absolute"
        top={top} left={left}
        lineHeight={0}
        pointerEvents="none"
        animation={`${iconDrift} ${dur} ease-in-out infinite`}
        style={{ animationDelay: delay }}
      >
        <Icon as={Cmp} boxSize={`${size * 4}px`} color={color} />
      </Box>
    ))}
  </Box>
);

export default LoginAnimatedBackground;
