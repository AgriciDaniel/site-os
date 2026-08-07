import type { ReactNode } from 'react'
import { HomeApp } from '@/components/apps/HomeApp'
import { ProductsApp } from '@/components/apps/ProductsApp'
import { PricingApp } from '@/components/apps/PricingApp'
import { AboutApp } from '@/components/apps/AboutApp'
import { NotesApp } from '@/components/apps/NotesApp'
import { TerminalApp } from '@/components/apps/TerminalApp'
import { SystemUpdateApp } from '@/components/apps/SystemUpdateApp'
import { TrashApp } from '@/components/apps/TrashApp'

/**
 * Path to window content.
 *
 * WHY THIS REGISTRY EXISTS, AND WHY THE OBVIOUS APPROACH FAILS
 *
 * Gatsby's `wrapPageElement` hands you `element`, a genuine snapshot of one
 * route's rendered tree. You can stash it in state and it keeps rendering that
 * route forever, which is exactly what a window needs.
 *
 * The App Router's `children` looks equivalent but is not. It is a live slot
 * that renders whatever the router currently points at. Storing it per window
 * and rendering several copies produces windows that ALL display the current
 * route: a window titled "Products" showing the Notes page. That was observed,
 * not theorised, and it is the single biggest gotcha in porting this pattern to
 * Next.js.
 *
 * So window content resolves from this table instead, keyed by path. Each route's
 * `page.tsx` renders the SAME component, which is what preserves the property
 * the whole design depends on: every route is still a real, statically rendered,
 * crawlable document, and boring mode gets it for free.
 *
 * Adding a page means two lines: a `page.tsx` that renders the component, and an
 * entry here. If a window's path has no entry, it falls back gracefully rather
 * than rendering blank.
 */
export const apps: Record<string, () => ReactNode> = {
    '/': HomeApp,
    '/products': ProductsApp,
    '/pricing': PricingApp,
    '/about': AboutApp,
    '/notes': NotesApp,
    '/terminal': TerminalApp,
    '/system-update': SystemUpdateApp,
    '/trash': TrashApp,
}

export function renderApp(path: string): ReactNode {
    const App = apps[path]
    if (!App) {
        return (
            <div className="text-[14px] text-muted">
                <p className="mb-2 font-semibold text-content">No app registered for this route</p>
                <p>
                    Add an entry for <code className="font-mono">{path}</code> to{' '}
                    <code className="font-mono">lib/apps.tsx</code>.
                </p>
            </div>
        )
    }
    return <App />
}
