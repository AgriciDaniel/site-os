import type { Config } from 'tailwindcss'
import containerQueries from '@tailwindcss/container-queries'

/**
 * Token architecture, adapted from the pattern documented in
 * ../study/os-shell-architecture.md section 6.
 *
 * Semantic colors resolve through CSS custom properties rather than Tailwind
 * `dark:` variants. Two axes multiply:
 *
 *   mode   -> `light` / `dark` class on <html>
 *   scheme -> `data-scheme="primary|secondary|tertiary"` on any element
 *
 * Their intersection is defined in app/globals.css and sets --bg / --border /
 * --text as space-separated RGB triples. The `<alpha-value>` placeholder lets
 * `bg-primary/50` work, which is what makes the frosted chrome possible.
 *
 * The practical payoff: a component never needs to know whether it sits in a
 * window header, a sidebar, or main content. It writes `bg-primary` and the
 * cascade resolves it.
 */
const config: Config = {
    darkMode: 'class',
    content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                // Semantic surfaces. These are the ones to use in components.
                primary: 'rgb(var(--bg) / <alpha-value>)',
                border: 'rgb(var(--border) / <alpha-value>)',
                content: 'rgb(var(--text) / <alpha-value>)',
                muted: 'rgb(var(--text-muted) / <alpha-value>)',
                accent: 'rgb(var(--accent) / <alpha-value>)',
                'accent-fg': 'rgb(var(--accent-fg) / <alpha-value>)',
                'signal-blue': '#315BD6',
                'signal-gold': '#E39A27',
                'signal-mint': '#22A691',
                'signal-coral': '#C54868',

                // Flat palette. PLACEHOLDER IDENTITY: replace these with your
                // brand values. Nothing else in the codebase needs to change,
                // because components reference the semantic tokens above.
                // A 12-step neutral ramp: 1 is the lightest surface, 12 the
                // darkest text. Steps 1-3 are surfaces, 4-7 borders, 8-10
                // secondary text, 11-12 primary text.
                ink: {
                    1: '#FBFBFD',
                    2: '#F2F3F7',
                    3: '#E8EAF0',
                    4: '#D8DBE4',
                    5: '#C3C7D4',
                    6: '#A8ADBE',
                    7: '#8B91A4',
                    8: '#6E7486',
                    9: '#565B69',
                    10: '#414551',
                    11: '#2E3138',
                    12: '#1A1C21',
                },
                iris: '#5B5BD6',
                'iris-dark': '#3E3EA8',
                mint: '#12A594',
                'mint-dark': '#0D7A6D',
                amber: '#FFB224',
                'amber-dark': '#C98A0E',
                coral: '#E5484D',
                'coral-dark': '#B02B30',
            },
            borderRadius: {
                window: '20px',
            },
            backdropBlur: {
                // 28px, not the reference's 64px. Blur cost scales with radius and
                // several of these run at once; see app/globals.css.
                chrome: '28px',
            },
            keyframes: {
                // Motion spec from ../study/os-shell-architecture.md section 5.
                windowPopIn: {
                    // Use the individual scale property so the completed
                    // animation never masks Framer Motion's drag translation.
                    from: { opacity: '0', scale: '0.92' },
                    to: { opacity: '1', scale: '1' },
                },
                windowPopOut: {
                    from: { opacity: '1', scale: '1' },
                    to: { opacity: '0', scale: '0.92' },
                },
                overlayFadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
                overlayFadeOut: { from: { opacity: '1' }, to: { opacity: '0' } },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-6px)' },
                },
            },
            animation: {
                // Entrances overshoot and run 200ms. Exits never bounce and run
                // 150ms, so the UI leaves faster than it arrives.
                'window-pop-in': 'windowPopIn 200ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
                'window-pop-out': 'windowPopOut 150ms cubic-bezier(0.55, 0, 1, 0.45) both',
                'overlay-fade-in': 'overlayFadeIn 200ms ease-out forwards',
                'overlay-fade-out': 'overlayFadeOut 150ms ease-in forwards',
                float: 'float 2s ease-in-out infinite',
            },
        },
    },
    plugins: [containerQueries],
}

export default config
