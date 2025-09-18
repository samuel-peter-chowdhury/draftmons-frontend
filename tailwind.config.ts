import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {},
    },
    plugins: [],
    corePlugins: {
        preflight: false, // Disable Tailwind's reset to avoid conflicts with MUI
    },
    important: '#__next', // Make Tailwind utilities more specific than MUI
}

export default config;