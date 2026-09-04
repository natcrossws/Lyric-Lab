import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Text,
  BoxProps,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiArrowLeft, FiSearch } from 'react-icons/fi';

const ICON_CIRCLE_SIZE = 14; // chakra space token → 3.5rem ≈ 56px

/** Tarjeta blanca compartida (cabecera de página y paneles principales). */
export const ADMIN_PANEL_SX = {
  borderRadius: '2xl',
  bg: 'white',
  borderWidth: '1px',
  borderColor: 'gray.100',
  boxShadow: '0 4px 24px rgba(var(--brand-rgb),  0.07), 0 1px 3px rgba(0, 0, 0, 0.06)',
};

/**
 * Cabecera homogénea para vistas admin (estilo “dashboard cards”):
 * - Icono circular + título + descripción
 * - Fila opcional: texto de ayuda a la izquierda, acciones a la derecha
 * - Búsqueda opcional ancho completo (redondeada)
 *
 * No fuerza paleta concreta: usa tokens `brand` y `gray` del tema.
 *
 * @param {object} props
 * @param {import('react').ComponentType} [props.icon] – react-icons
 * @param {string | import('react').ReactNode} props.title
 * @param {string} [props.description]
 * @param {string | import('react').ReactNode} [props.instruction] – texto o nodo a la izquierda del toolbar
 * @param {import('react').ReactNode} [props.actions] – botones a la derecha del toolbar
 * @param {import('react').ReactNode} [props.titleAside] – ej. Badge junto al bloque de título
 * @param {string} [props.searchPlaceholder] – si se pasa, muestra Input de búsqueda
 * @param {string} [props.searchValue]
 * @param {(e: import('react').ChangeEvent<HTMLInputElement>) => void} [props.onSearchChange]
 * @param {import('react').ReactNode} [props.search] – slot libre (sustituye el Input simple)
 * @param {{ to: string, label?: string }} [props.backLink] – enlace “volver” encima del bloque principal
 */
interface AdminPageShellProps {
  icon?: import('react').ElementType;
  title: string | import('react').ReactNode;
  description?: string;
  instruction?: string | import('react').ReactNode;
  actions?: import('react').ReactNode;
  titleAside?: import('react').ReactNode;
  backLink?: { to: string; label?: string };
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (e: import('react').ChangeEvent<HTMLInputElement>) => void;
  search?: import('react').ReactNode;
  children?: import('react').ReactNode;
  mb?: number | string;
}

export default function AdminPageShell({
  icon: IconComponent,
  title,
  description,
  instruction,
  actions,
  titleAside,
  backLink,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  search: searchSlot,
  children,
  mb = 8,
}: AdminPageShellProps) {
  const titleNode =
    typeof title === 'string' ? (
      <Heading
        as="h1"
        size="lg"
        color="gray.800"
        fontWeight="800"
        letterSpacing="-0.03em"
        lineHeight="1.15"
      >
        {title}
      </Heading>
    ) : (
      title
    );

  const instructionNode =
    instruction == null || instruction === false ? null : typeof instruction === 'string' ? (
      <Text fontSize="sm" color="gray.600" lineHeight="short">
        {instruction}
      </Text>
    ) : (
      instruction
    );

  const showToolbar = instructionNode != null || actions != null;
  const showSearch =
    searchSlot != null ||
    (searchPlaceholder != null && (onSearchChange != null || searchValue !== undefined));

  return (
    <Stack spacing={6} mb={mb}>
      {backLink ? (
        <Button
          as={RouterLink}
          to={backLink.to}
          leftIcon={<FiArrowLeft />}
          variant="ghost"
          size="sm"
          alignSelf="flex-start"
          mb={3}
          color="gray.600"
        >
          {backLink.label ?? 'Volver'}
        </Button>
      ) : null}

      <Box {...ADMIN_PANEL_SX} p={{ base: 5, md: 7 }}>
      <Flex
        gap={{ base: 4, md: 5 }}
        align="flex-start"
        direction={{ base: 'column', sm: 'row' }}
        mb={description || titleAside ? 4 : showToolbar || showSearch ? 4 : 0}
      >
        {IconComponent ? (
          <Flex
            w={ICON_CIRCLE_SIZE}
            h={ICON_CIRCLE_SIZE}
            minW={ICON_CIRCLE_SIZE}
            borderRadius="full"
            bg="brand.500"
            color="white"
            align="center"
            justify="center"
            flexShrink={0}
            boxShadow="0 4px 14px rgba(var(--brand-rgb),  0.28)"
          >
            <Icon as={IconComponent} boxSize={7} />
          </Flex>
        ) : null}

        <Stack spacing={1} flex="1" minW={0}>
          <Flex align="flex-start" justify="space-between" gap={3} flexWrap="wrap">
            <Box flex="1" minW="180px">
              {titleNode}
              {description ? (
                <Text mt={1.5} color="gray.500" fontSize="sm" lineHeight="1.55" maxW="4xl">
                  {description}
                </Text>
              ) : null}
            </Box>
            {titleAside ? <Box flexShrink={0}>{titleAside}</Box> : null}
          </Flex>
        </Stack>
      </Flex>

      {showToolbar ? (
        <Flex
          align={{ base: 'stretch', md: 'center' }}
          justify="space-between"
          gap={4}
          flexWrap="wrap"
          mb={showSearch || children ? 4 : 0}
          pt={1}
        >
          <Box flex="1" minW={{ base: '100%', md: '240px' }}>
            {instructionNode}
          </Box>
          {actions ? (
            <HStack spacing={2} flexWrap="wrap" justify={{ base: 'flex-start', md: 'flex-end' }}>
              {actions}
            </HStack>
          ) : null}
        </Flex>
      ) : null}

      {showSearch ? (
        <Box mb={children ? 4 : 0}>
          {searchSlot ?? (
            <InputGroup size="md">
              <InputLeftElement pointerEvents="none" h="full">
                <Icon as={FiSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                pl={10}
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={onSearchChange}
                borderRadius="full"
                bg="gray.50"
                borderColor="gray.200"
                boxShadow="sm"
                _hover={{ borderColor: 'gray.300' }}
                _focusVisible={{
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 3px rgba(var(--brand-rgb),  0.18)',
                }}
              />
            </InputGroup>
          )}
        </Box>
      ) : null}
      </Box>

      {children ? (
        <Box>
          {children}
        </Box>
      ) : null}
    </Stack>
  );
}

/**
 * Contenedor del área principal (listas, tablas, grids) con tarjeta blanca suave.
 */
interface AdminMainPanelProps extends BoxProps {
  children: import('react').ReactNode;
  compact?: boolean;
}

export function AdminMainPanel({ children, compact = false, ...boxProps }: AdminMainPanelProps) {
  return (
    <Box
      {...ADMIN_PANEL_SX}
      p={compact ? { base: 4, md: 5 } : { base: 5, md: 6 }}
      {...boxProps}
    >
      {children}
    </Box>
  );
}
