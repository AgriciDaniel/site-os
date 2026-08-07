import type { Metadata } from 'next'
import './globals.css'
import { ShellProvider } from '@/components/shell/ShellProvider'
import { Shell, ExperienceSwitch } from '@/components/shell/Shell'

export const metadata: Metadata = {
    title: { default: 'Site OS Community Template', template: '%s | Site OS' },
    description:
        'A responsive Site OS interface over ordinary static pages, with a locked route window by default and an optional free-window desktop.',
}

/**
 * The root layout is where the desktop replaces the page.
 *
 * `children` is the current route's rendered page. In desktop mode the shell
 * renders instead of it, and window content is resolved by path from
 * `lib/apps.tsx`. In boring mode `children` renders directly, which is what
 * keeps every route a real, crawlable document.
 *
 * `suppressHydrationWarning` on <html> is required because ShellProvider stamps
 * the mode class and skin attributes after mount, so the server and client
 * markup differ on those attributes by design.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="light" data-skin="modern" suppressHydrationWarning>
            <body>
                <ShellProvider>
                    <ExperienceSwitch page={children}>
                        <Shell />
                    </ExperienceSwitch>
                </ShellProvider>
            </body>
        </html>
    )
}
