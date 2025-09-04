import { extendTheme } from '@chakra-ui/react';

// 1. Define your color tokens with green gradient palette
const colors = {
  brand: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  gradient: {
    primary: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    hover: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    subtle: 'linear-gradient(to right, #f0fdf4, #dcfce7)',
  },
};

// 2. Create a custom theme
const theme = extendTheme({
  colors,
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
  },
  styles: {
    global: (props: any) => ({
      'html, body': {
        bg: 'white',
        color: 'gray.800',
        minHeight: '100vh',
      },
      '::selection': {
        bg: 'brand.400',
        color: 'white',
      },
      '::-webkit-scrollbar': {
        width: '10px',
      },
      '::-webkit-scrollbar-track': {
        bg: 'gray.50',
      },
      '::-webkit-scrollbar-thumb': {
        bg: 'brand.400',
        borderRadius: 'full',
        '&:hover': {
          bg: 'brand.500',
        },
      },
    }),
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'lg',
        _focus: {
          ring: '2px',
          ringColor: 'brand.200',
        },
      },
      variants: {
        solid: (props: any) => ({
          bg: 'gradient.primary',
          color: 'white',
          _hover: {
            bg: 'gradient.hover',
            transform: 'translateY(-1px)',
            boxShadow: 'md',
            _disabled: {
              transform: 'none',
            },
          },
          _active: {
            transform: 'translateY(1px)',
          },
        }),
        outline: {
          border: '2px solid',
          borderColor: 'brand.300',
          color: 'brand.700',
          _hover: {
            bg: 'brand.50',
            borderColor: 'brand.400',
          },
        },
      },
      defaultProps: {
        colorScheme: 'brand',
        variant: 'solid',
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: 'lg',
          _focus: {
            borderColor: 'brand.400',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)',
          },
        },
      },
      defaultProps: {
        focusBorderColor: 'brand.400',
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'xl',
          boxShadow: 'sm',
          _hover: {
            boxShadow: 'md',
          },
        },
      },
    },
  },
});

export default theme;
