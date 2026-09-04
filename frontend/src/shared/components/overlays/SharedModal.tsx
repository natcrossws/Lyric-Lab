import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
} from '@chakra-ui/react';

/**
 * Modal compartida: misma estructura (Overlay → Content → Header / Body / Footer) en todo el sistema.
 *
 * @param {ReactNode} [title] - Título del header (omitir para modales solo contenido).
 * @param {object} [headerProps] - Props extra para ModalHeader.
 * @param {object} [bodyProps] - Props para ModalBody (p. ej. p={0}, minH).
 * @param {object} [footerProps] - Props para ModalFooter.
 * @param {object} [contentProps] - Props para ModalContent (p. ej. bg, maxW).
 * @param {object} [overlayProps] - Props para ModalOverlay (sobrescribe blur/fondo por defecto).
 * @param {object|null} [formProps] - Si se pasa, ModalBody + pie van dentro de `<Box as="form" {...formProps}>`.
 */

function headerHasCustomSurface(headerProps) {
  if (!headerProps || typeof headerProps !== 'object') return false;
  return ['bg', 'background', 'bgGradient', 'backgroundImage'].some(
    (key) => headerProps[key] != null && headerProps[key] !== ''
  );
}

const SharedModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer = null,
  hideDefaultFooter = false,
  isCentered = true,
  motionPreset,
  scrollBehavior = 'inside',
  closeOnOverlayClick = true,
  contentProps = {} as any,
  overlayProps = {},
  bodyProps = {},
  footerProps = {},
  headerProps = {},
  showCloseButton = true,
  closeButtonProps = {},
  formProps = null,
}) => {
  const hasTitle = title != null && title !== '';
  const applyBrandHeaderTitleChroma = hasTitle && !headerHasCustomSurface(headerProps);

  const contentHasExplicitHeight =
    contentProps.maxH != null ||
    contentProps.maxHeight != null ||
    contentProps.h != null ||
    contentProps.height != null;

  const contentMaxHProps =
    scrollBehavior === 'inside' && !contentHasExplicitHeight
      ? { maxH: 'min(92dvh, calc(100vh - 2rem))' }
      : {};

  const footerSurfaceProps = {
    borderTopWidth: '1px',
    borderTopColor: 'rgba(var(--chakra-colors-red-500),  0.28)',
    bg: 'linear-gradient(180deg, rgba(255,252,248,0.94) 0%, rgba(255,255,255,0.76) 48%, rgba(237,246,255,0.9) 100%)',
    backdropFilter: 'blur(20px) saturate(180%)',
    sx: {
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    },
    borderBottomRadius: '2xl',
    py: { base: 3, md: 4 },
    px: { base: 4, md: 6 },
    gap: 3,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexShrink: 0,
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.95), 0 -1px 0 rgba(0, 59, 113, 0.04), inset 0 2px 0 rgba(255,158,27,0.12)',
  };

  const footerNode = footer ? (
    <ModalFooter {...(footerSurfaceProps as any)} {...footerProps}>
      {footer}
    </ModalFooter>
  ) : (
    !hideDefaultFooter && (
      <ModalFooter {...(footerSurfaceProps as any)} {...footerProps}>
        <Button
          variant="outline"
          colorScheme="brand"
          onClick={onClose}
          borderRadius="xl"
          fontWeight="600"
          h="40px"
          px={7}
          borderWidth="1.5px"
          transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
          _hover={{
            bg: 'brand.50',
            borderColor: 'brand.400',
            boxShadow: '0 4px 14px rgba(var(--brand-rgb),  0.14)',
          }}
        >
          Cerrar
        </Button>
      </ModalFooter>
    )
  );

  const bodyScrollProps =
    scrollBehavior === 'inside'
      ? { flex: '1', minH: 0, minW: 0, overflowY: 'auto' }
      : {};

  const bodyNode = (
    <ModalBody
      {...(bodyScrollProps as any)}
      py={{ base: 5, md: 6 }}
      px={{ base: 4, md: 6 }}
      color="gray.800"
      sx={{
        '&::-webkit-scrollbar': { w: '8px' },
        '&::-webkit-scrollbar-track': { bg: 'transparent' },
        '&::-webkit-scrollbar-thumb': {
          bg: 'rgba(var(--brand-rgb),  0.18)',
          borderRadius: 'full',
        },
      }}
      {...bodyProps}
    >
      {children}
    </ModalBody>
  );

  const formFlexShellProps = {
    display: 'flex',
    flexDirection: 'column',
    flex: '1',
    minH: 0,
    minW: 0,
    overflow: 'hidden',
  };

  const mainColumn = formProps ? (
    <Box as="form" {...formProps} {...(formFlexShellProps as any)}>
      {bodyNode}
      {footerNode}
    </Box>
  ) : (
    <>
      {bodyNode}
      {footerNode}
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      isCentered={isCentered}
      scrollBehavior={scrollBehavior as any}
      closeOnOverlayClick={closeOnOverlayClick}
      {...(motionPreset != null ? { motionPreset } : { motionPreset: 'scale' })}
    >
      <ModalOverlay
        bg="blackAlpha.400"
        backdropFilter="blur(10px) saturate(160%)"
        sx={{ WebkitBackdropFilter: 'blur(10px) saturate(160%)' }}
        {...overlayProps}
      />
      <ModalContent
        bg="white"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="rgba(var(--brand-rgb),  0.1)"
        display="flex"
        flexDirection="column"
        overflow="hidden"
        boxShadow="
          0 0 0 1px rgba(255,255,255,0.6) inset,
          0 0 0 1px rgba(244,227,138,0.14),
          0 32px 64px -16px rgba(var(--brand-rgb),  0.2),
          0 20px 48px -18px rgba(76, 61, 25, 0.1),
          0 16px 32px -8px rgba(15, 23, 42, 0.12)
        "
        {...contentProps}
        {...(contentMaxHProps as any)}
      >
        {hasTitle && (
          <ModalHeader
            position="relative"
            overflow="hidden"
            flexShrink={0}
            display="flex"
            alignItems="center"
            minH={{ base: '56px', md: '60px' }}
            bgGradient="linear(135deg, brand.800 0%, brand.700 14%, brand.500 48%, brand.600 68%, rgba(160,28,22,0.55) 88%, rgba(120,20,18,0.65) 100%)"
            color="white"
            borderBottomWidth="1px"
            borderBottomColor="rgba(var(--chakra-colors-red-500), 0.45)"
            py={{ base: 4, md: 5 }}
            px={{ base: 4, md: 6 }}
            pr={showCloseButton ? { base: 14, md: 16 } : undefined}
            fontSize="lg"
            fontWeight="semibold"
            letterSpacing="-0.03em"
            lineHeight="tall"
            sx={{
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                h: '1px',
                bgGradient:
                  'linear(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                bgGradient:
                  'radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.14) 0%, transparent 55%)',
                pointerEvents: 'none',
              },
            }}
            {...headerProps}
          >
            <Box
              as="div"
              position="relative"
              zIndex={1}
              w="100%"
              display="flex"
              flexDirection="column"
              alignItems={(headerProps as any)?.textAlign === 'center' ? 'center' : 'flex-start'}
              gap={1}
              sx={
                applyBrandHeaderTitleChroma
                  ? {
                      color: 'white',
                      '& .chakra-heading, & h1, & h2, & h3, & h4, & h5, & h6': {
                        color: 'white !important',
                      },
                      '& .chakra-text, & p': {
                        color: 'rgba(255,255,255,0.88) !important',
                      },
                    }
                  : undefined
              }
            >
              {title}
            </Box>
            <Box
              position="absolute"
              left={0}
              right={0}
              bottom={0}
              h="3px"
              zIndex={2}
              pointerEvents="none"
              bgGradient="linear(to-r, rgba(131,153,88,0.95) 0%, rgba(var(--brand-rgb), 0.9) 32%, rgba(244,227,138,0.82) 52%, rgba(var(--brand-rgb), 0.85) 72%, rgba(10,51,35,0.28) 92%, rgba(10,51,35,0) 100%)"
              borderBottomLeftRadius="2px"
              borderBottomRightRadius="2px"
            />
          </ModalHeader>
        )}
        {showCloseButton && (
          <ModalCloseButton
            {...(hasTitle
              ? {
                  color: 'white',
                  bg: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  backdropFilter: 'blur(8px)',
                  sx: { WebkitBackdropFilter: 'blur(8px)' },
                  top: '50%',
                  right: 4,
                  transform: 'translateY(-50%)',
                  _hover: {
                    bg: 'rgba(255,255,255,0.24)',
                    transform: 'translateY(-50%) scale(1.06)',
                  },
                  _active: { transform: 'translateY(-50%) scale(0.98)' },
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderRadius: 'full',
                  w: '36px',
                  h: '36px',
                  fontSize: '11px',
                }
              : { mt: 2, mr: 2 })}
            {...closeButtonProps}
          />
        )}
        {mainColumn}
      </ModalContent>
    </Modal>
  );
};

export default SharedModal;
