import type { Config } from 'tailwindcss';

const withOpacity = (cssVar: `--${string}`): string => `hsl(var(${cssVar}) / <alpha-value>)`;

const config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        background: withOpacity('--background'),
        foreground: withOpacity('--foreground'),
        card: withOpacity('--card'),
        'card-foreground': withOpacity('--card-foreground'),
        popover: withOpacity('--popover'),
        'popover-foreground': withOpacity('--popover-foreground'),
        primary: withOpacity('--primary'),
        'primary-foreground': withOpacity('--primary-foreground'),
        secondary: withOpacity('--secondary'),
        'secondary-foreground': withOpacity('--secondary-foreground'),
        muted: withOpacity('--muted'),
        'muted-foreground': withOpacity('--muted-foreground'),
        accent: withOpacity('--accent'),
        'accent-foreground': withOpacity('--accent-foreground'),
        destructive: withOpacity('--destructive'),
        'destructive-foreground': withOpacity('--destructive-foreground'),
        border: withOpacity('--border'),
        input: withOpacity('--input'),
        ring: withOpacity('--ring'),
        success: withOpacity('--success'),
        'success-foreground': withOpacity('--success-foreground'),
        warning: withOpacity('--warning'),
        'warning-foreground': withOpacity('--warning-foreground'),
        info: withOpacity('--info'),
        'info-foreground': withOpacity('--info-foreground'),
        surface: withOpacity('--card'),
        'surface-hover': withOpacity('--secondary'),
        'neon-blue': withOpacity('--info'),
        'neon-orange': withOpacity('--warning'),
        sidebar: {
          DEFAULT: withOpacity('--sidebar-background'),
          foreground: withOpacity('--sidebar-foreground'),
          primary: withOpacity('--sidebar-primary'),
          'primary-foreground': withOpacity('--sidebar-primary-foreground'),
          accent: withOpacity('--sidebar-accent'),
          'accent-foreground': withOpacity('--sidebar-accent-foreground'),
          border: withOpacity('--sidebar-border'),
          ring: withOpacity('--sidebar-ring')
        }
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
} satisfies Config;

export default config;
