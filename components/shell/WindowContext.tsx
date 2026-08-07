'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { AppWindow } from '@/lib/types'

/**
 * Exposes the window a component is rendering inside.
 *
 * Why this exists: page content sometimes needs to know its own window, for
 * example to size a chart to the window rather than the viewport, or to open a
 * link in a sibling window. Without this, content would have to receive that
 * through props from the shell, which would couple every page to the shell.
 *
 * The value is memoized on the fields consumers actually read. An unmemoized
 * value would produce a new identity on every drag frame and re-render all page
 * content 60 times a second while a window moves.
 */
const Ctx = createContext<{ window: AppWindow } | null>(null)

export function WindowProvider({
    window: win,
    children,
}: {
    window: AppWindow
    children: ReactNode
}) {
    const value = useMemo(
        () => ({ window: win }),
        // Deliberately narrow: position changes every frame during a drag and no
        // consumer needs it, so it is excluded.
        [win.key, win.path, win.title, win.size.width, win.size.height, win.maximized, win.snapped]
    )
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useWindow() {
    const c = useContext(Ctx)
    if (!c) throw new Error('useWindow must be used inside a WindowProvider')
    return c
}

/** Safe variant for components that may render outside a window. */
export function useOptionalWindow() {
    return useContext(Ctx)
}
