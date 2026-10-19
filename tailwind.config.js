/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./src/app/**/*.{js,jsx}', './src/modules/**/*.{js,jsx}', './src/shared/**/*.{js,jsx}'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '16px',
        md: '24px',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1200px',
        '2xl': '1200px',
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1385B5',
          hover: '#0E6D96',
          active: '#0A5878',
        },
        accent: {
          DEFAULT: '#FFE61E',
          hover: '#F5D90A',
          active: '#E6C800',
        },
        secondary: '#F4685B',
        sale: '#F0524B',
        success: {
          DEFAULT: '#22A34A',
          strong: '#15803D',
        },
        star: '#FFC107',
        ink: '#1F2A37',
        slate: '#6B7280',
        mist: '#9CA3AF',
        fog: '#E5E7EB',
        surface: {
          mint: '#E6F4F1',
          blush: '#FCEBEC',
          sky: '#E3F3FA',
        },
        rainbow: {
          red: '#F4685B',
          orange: '#F7A23B',
          yellow: '#FCD34D',
          green: '#6CC59B',
          blue: '#3EA6DE',
          violet: '#9B7FD4',
        },
      },
      fontFamily: {
        // Baloo 2 phủ đầy đủ dấu tiếng Việt; Nunito là dự phòng khi font chưa tải.
        heading: [
          'var(--font-baloo)',
          '"Baloo 2"',
          'var(--font-nunito)',
          'Nunito',
          'system-ui',
          'sans-serif',
        ],
        body: ['var(--font-nunito)', 'Nunito', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['56px', { lineHeight: '1.1', fontWeight: '700' }],
        h1: ['44px', { lineHeight: '1.2', fontWeight: '700' }],
        h2: ['34px', { lineHeight: '1.25', fontWeight: '700' }],
        h3: ['26px', { lineHeight: '1.3', fontWeight: '600' }],
        h4: ['22px', { lineHeight: '1.35', fontWeight: '600' }],
        h5: ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        h6: ['16px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-l': ['18px', { lineHeight: '1.6' }],
        body: ['16px', { lineHeight: '1.6' }],
        'body-s': ['14px', { lineHeight: '1.5' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '500' }],
        price: ['20px', { lineHeight: '1.2', fontWeight: '700' }],
        'price-old': ['14px', { lineHeight: '1.2' }],
      },
      borderRadius: {
        sm: '12px',
        md: '16px',
        lg: '20px',
        xl: '24px',
      },
      maxWidth: {
        site: '1200px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(31, 42, 55, 0.06), 0 8px 24px rgba(31, 42, 55, 0.06)',
        lift: '0 12px 32px rgba(31, 42, 55, 0.12)',
      },
      transitionDuration: {
        250: '250ms',
      },
    },
  },
  plugins: [],
};

export default config;
