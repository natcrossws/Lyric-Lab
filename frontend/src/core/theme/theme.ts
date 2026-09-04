import { extendTheme } from '@chakra-ui/react';

/** Paleta Margarita Beach — ver §8.5 guía de desarrollo (docs/guia_desarrollo) */
const theme = extendTheme({
  colors: {
    brand: {
      50: 'var(--chakra-colors-brand-50)',
      100: '#EBE8D4',
      200: '#DCD8C4',
      300: '#889063',
      400: '#839958',
      500: 'var(--chakra-colors-brand-500)',
      600: 'var(--chakra-colors-brand-600)',
      700: '#0A3323',
      800: 'var(--chakra-colors-brand-800)',
      900: 'var(--chakra-colors-brand-900)',
    },
    secondary: {
      50: '#FAF6EE',
      100: '#F0E8D8',
      200: '#E0CDB0',
      300: '#C9B088',
      400: '#A68960',
      500: '#4C3D19',
      600: '#3D3215',
      700: '#2E2610',
    },
    accent: {
      warm: '#F4E38A',
      sage: '#889063',
      olive: '#839958',
      forest: '#354024',
      orange: '#CDA067',
      orangeMuted: '#E0C4A0',
      yellow: '#FEF9E8',
      blue: '#E5F0F2',
      green: '#E8EDE0',
      pink: '#F5E8E8',
      purple: '#EDE8F5',
      indigo: '#E8ECF5',
    },
    gray: {
      50: '#FAF9F4',
      100: '#F0EEE6',
      200: '#E2DFD4',
      300: '#CCC9BD',
      400: '#9A9588',
      500: '#6B665C',
      600: '#4D4940',
      700: '#3D3A33',
      800: '#2A2823',
      900: '#1A1815',
    },
    sidebar: {
      bg: 'rgba(255, 255, 255, 0.8)',
      active: 'var(--chakra-colors-brand-500)',
      text: '#2A2823',
      textInactive: '#6B665C',
      border: 'rgba(255, 255, 255, 0.3)',
      hover: 'rgba(var(--brand-rgb),  0.1)',
    },
  },
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '500',
        borderRadius: '8px',
        transition: 'all 0.2s ease-in-out',
        _hover: {
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        _active: {
          transform: 'translateY(0)',
        },
      },
      variants: {
        solid: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
          _hover: {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
        primary: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
            boxShadow: 'xl',
          },
        },
      },
      defaultProps: {
        colorScheme: 'brand',
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: '16px',
          border: '1px solid',
          borderColor: 'gray.100',
          bg: 'white',
          boxShadow: '0 4px 24px rgba(var(--brand-rgb),  0.06), 0 1px 3px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.2s ease-in-out',
          _hover: {
            boxShadow: '0 8px 28px rgba(var(--brand-rgb),  0.09), 0 2px 6px rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: '8px',
          borderColor: 'gray.300',
          transition: 'all 0.2s ease-in-out',
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 3px rgba(var(--brand-rgb),  0.18)',
          },
          _hover: {
            borderColor: 'gray.400',
          },
        },
      },
    },
    Select: {
      baseStyle: {
        field: {
          borderRadius: '8px',
          borderColor: 'gray.300',
          transition: 'all 0.2s ease-in-out',
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 3px rgba(var(--brand-rgb),  0.18)',
          },
          _hover: {
            borderColor: 'gray.400',
          },
        },
      },
    },
    Textarea: {
      baseStyle: {
        borderRadius: '8px',
        borderColor: 'gray.300',
        transition: 'all 0.2s ease-in-out',
        _focus: {
          borderColor: 'brand.500',
          boxShadow: '0 0 0 3px rgba(var(--brand-rgb),  0.18)',
        },
        _hover: {
          borderColor: 'gray.400',
        },
      },
    },
    Modal: {
      baseStyle: {
        overlay: {
          bg: 'blackAlpha.600',
          backdropFilter: 'blur(4px)',
        },
        dialog: {
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid',
          borderColor: 'gray.200',
          maxW: '5xl',
        },
        header: {
          borderBottom: '1px solid',
          borderColor: 'gray.200',
          pb: 3,
          fontWeight: '700',
          fontSize: '18px',
        },
        footer: {
          borderTop: '1px solid',
          borderColor: 'gray.200',
          pt: 4,
        },
      },
    },
    Table: {
      baseStyle: {
        th: {
          fontWeight: '600',
          textTransform: 'uppercase',
          fontSize: '11px',
          letterSpacing: '0.5px',
          color: 'gray.500',
          borderColor: 'gray.200',
          bg: 'gray.50',
        },
        td: {
          borderColor: 'gray.200',
          fontSize: '14px',
        },
        tr: {
          transition: 'all 0.2s ease-in-out',
          _hover: {
            bg: 'gray.50',
          },
        },
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: '6px',
        px: 2,
        py: 1,
        fontWeight: '500',
        fontSize: '12px',
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'var(--chakra-colors-chakra-body-bg, #f8fafc)',
        color: 'brand.700',
        fontFamily: 'Inter, sans-serif',
      },
      '*::placeholder': {
        color: 'gray.400',
      },
    },
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
});

export default theme;
