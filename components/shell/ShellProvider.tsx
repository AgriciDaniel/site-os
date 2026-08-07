'use client'

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
    type RefObject,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { resolveGeometry, settingsFor } from '@/lib/appSettings'
import type { AppWindow, Size, Snapped, WindowMode } from '@/lib/types'

/**
 * The window manager, built for the Next.js App Router.
 *
 * THE PORT PROBLEM
 *
 * Gatsby exposes `wrapPageElement`, which hands you a real snapshot of one
 * route's rendered tree, and lets you render something else in its place:
 *
 *     <Provider element={element} location={location}><Wrapper /></Provider>
 *
 * The App Router's `children` looks like the same thing but is not: it is a live
 * slot that always renders the CURRENT route. Storing it per window produces
 * windows that all show the same page. So this provider owns only window
 * geometry and identity, and content is resolved by path in `lib/apps.tsx`.
 * That file documents the failure in full.
 *
 * Routes remain ordinary server components: statically rendered, crawlable, and
 * readable with the shell switched off, which is what makes the metaphor safe.
 */

/** Windows start above this, leaving room for desktop and taskbar layers. */
const Z_BASE = 10
const EXIT_MS = 160 // just past the 150ms exit animation
const WALLPAPER_COUNT = 3

type Panel = 'none' | 'shortcuts' | 'display'

/**
 * How a navigation should resolve against the open windows.
 *
 * A window manager needs three navigation behaviours. Two intents are not
 * enough because desktop icons should not replace unrelated focused content.
 *
 *   'replace'  in-content links. Reuse the focused window, like a browser tab.
 *   'launch'   desktop icons and menu items. Focus the window already showing
 *              this route, otherwise open a NEW one. Never replace unrelated
 *              content, and never open a second copy of the same app. This is
 *              how a Dock or a taskbar behaves.
 *   'new'      an explicit "open in new window", every time.
 *
 * Without 'launch', a desktop icon either stomps whatever window has focus
 * ('replace') or stacks up duplicate copies of itself ('new'). Both are wrong.
 */
export type OpenIntent = 'replace' | 'launch' | 'new'

interface ShellContext {
    windows: AppWindow[]
    windowMode: WindowMode
    desktopRef: RefObject<HTMLDivElement | null>
    focusedKey: string | null
    openPath: (path: string, opts?: { intent?: OpenIntent }) => void
    close: (key: string) => void
    closeAll: () => void
    focus: (key: string) => void
    minimize: (key: string) => void
    restore: (key: string) => void
    /** Restore a free window to its route's default, centered geometry. */
    resetWindow: (key: string) => void
    toggleMaximize: (key: string) => void
    snap: (key: string, side: Snapped) => void
    update: (key: string, patch: Partial<AppWindow>) => void
    mode: 'light' | 'dark'
    setMode: (m: 'light' | 'dark') => void
    skin: 'modern' | 'classic'
    setSkin: (s: 'modern' | 'classic') => void
    wallpaper: number
    cycleWallpaper: () => void
    /**
     * When true, all backdrop blur is dropped and chrome becomes opaque. Both an
     * accessibility setting and a performance escape hatch: backdrop blur is the
     * most expensive thing this interface does.
     */
    reduceTransparency: boolean
    setReduceTransparency: (v: boolean) => void
    /** Frame-pacing overlay, so smoothness can be measured on real hardware. */
    showFps: boolean
    setShowFps: (v: boolean) => void
    panel: Panel
    setPanel: (p: Panel) => void
}

const Ctx = createContext<ShellContext | null>(null)

export function useShell(): ShellContext {
    const c = useContext(Ctx)
    if (!c) throw new Error('useShell must be used inside ShellProvider')
    return c
}

const titleFromPath = (path: string): string => {
    if (path === '/') return 'Home'
    const last = path.split('/').filter(Boolean).pop() ?? 'Untitled'
    return last.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Next z-index, derived from the array so there is no separate counter to desync. */
const nextZ = (ws: AppWindow[]) => ws.reduce((m, w) => Math.max(m, w.zIndex), Z_BASE) + 1

/**
 * Build a window for a path. Shared by the navigation effect and by `openPath`,
 * because both need to create windows and duplicating the construction is how the
 * two drift apart.
 */
function makeWindow(path: string, desktop: Size, openCount: number, z: number): AppWindow {
    const geo = resolveGeometry(path, desktop, openCount)
    const s = settingsFor(path)
    return {
        key: `${path}::${z}`,
        path,
        title: s.title ?? titleFromPath(path),
        zIndex: z,
        position: geo.position,
        size: geo.size,
        previousPosition: geo.position,
        previousSize: geo.size,
        minimized: false,
        maximized: false,
        snapped: false as Snapped,
        fixedSize: geo.fixedSize,
        constraints: geo.constraints,
    }
}

export function ShellProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const desktopRef = useRef<HTMLDivElement | null>(null)

    const [windows, setWindows] = useState<AppWindow[]>([])
    const [windowMode, setWindowMode] = useState<WindowMode>('locked')
    const [mode, setMode] = useState<'light' | 'dark'>('light')
    const [skin, setSkin] = useState<'modern' | 'classic'>('modern')
    const [wallpaper, setWallpaper] = useState(0)
    const [reduceTransparency, setReduceTransparency] = useState(false)
    const [showFps, setShowFps] = useState(false)
    const [panel, setPanel] = useState<Panel>('none')

    // A link sets this immediately before navigating; the pathname effect below
    // consumes it. App Router navigation cannot carry arbitrary state the way
    // Gatsby's `location.state` could, so intent rides in a ref.
    const intentRef = useRef<OpenIntent>('replace')

    // The responsive, single-window presentation is the product default. The
    // full window manager remains available as an explicit desktop playground.
    useEffect(() => {
        const readMode = () => {
            const requested = new URLSearchParams(window.location.search).get('windows')
            setWindowMode(requested === 'free' ? 'free' : 'locked')
        }
        readMode()
        window.addEventListener('popstate', readMode)
        return () => window.removeEventListener('popstate', readMode)
    }, [])

    const desktopSize = useCallback((): Size => {
        const el = desktopRef.current
        if (!el) return { width: 1280, height: 800 }
        const r = el.getBoundingClientRect()
        return { width: Math.round(r.width), height: Math.round(r.height) }
    }, [])

    /**
     * Resolve a navigation against the open windows (architecture doc section 3),
     * per the intent that requested it:
     *   1. focus and refresh the window already holding this path
     *   2. replace the focused window's content, for 'replace' only
     *   3. otherwise open a new window
     */
    useEffect(() => {
        if (!pathname) return
        const intent = intentRef.current
        intentRef.current = 'replace'

        setWindows((ws) => {
            if (windowMode === 'locked') {
                const live = ws.find((w) => !w.closing)
                if (!live) return [makeWindow(pathname, desktopSize(), 0, nextZ(ws))]
                const s = settingsFor(pathname)
                return [
                    {
                        ...live,
                        path: pathname,
                        title: s.title ?? titleFromPath(pathname),
                        minimized: false,
                        zIndex: nextZ(ws),
                    },
                ]
            }

            const existing = ws.find((w) => w.path === pathname && !w.closing)

            // 1. Already open. Focus it, un-minimize it, refresh its content.
            //    'new' is the only intent that deliberately opens a second copy.
            if (existing && intent !== 'new') {
                const z = nextZ(ws)
                return ws.map((w) =>
                    w.key === existing.key
                        ? { ...w, minimized: false, zIndex: z }
                        : w
                )
            }

            const live = ws.filter((w) => !w.closing)
            const focused = live.length
                ? live.reduce((a, b) => (a.zIndex > b.zIndex ? a : b))
                : null

            // 2. Reuse the focused window, but only for in-content navigation.
            //    A launch must never stomp whatever the user was looking at.
            if (focused && intent === 'replace') {
                const s = settingsFor(pathname)
                return ws.map((w) =>
                    w.key === focused.key
                        ? {
                              ...w,
                              path: pathname,
                              title: s.title ?? titleFromPath(pathname),
                          }
                        : w
                )
            }

            // 3. Open a new window.
            return [...ws, makeWindow(pathname, desktopSize(), live.length, nextZ(ws))]
        })
        // `page` is deliberately NOT a dependency: window content resolves from
        // lib/apps.tsx by path, not from the live children slot.
    }, [pathname, desktopSize, windowMode])

    const openPath = useCallback(
        (path: string, opts?: { intent?: OpenIntent }) => {
            const intent = opts?.intent ?? 'replace'
            intentRef.current = intent
            if (windowMode === 'locked' && path === pathname) {
                setWindows((ws) => {
                    const live = ws.find((w) => !w.closing)
                    if (live) {
                        const s = settingsFor(path)
                        return [
                            {
                                ...live,
                                path,
                                title: s.title ?? titleFromPath(path),
                                minimized: false,
                                zIndex: nextZ(ws),
                            },
                        ]
                    }
                    return [makeWindow(path, desktopSize(), 0, nextZ(ws))]
                })
                return
            }
            // Launching the route that is ALREADY the current pathname does not
            // navigate, so the pathname effect never fires. Handle it here.
            //
            // The first version returned early when no window existed for the
            // path, which dead-ended: open Pricing, close it, then click the
            // Pricing icon again and NOTHING happened, because the pathname was
            // still /pricing. Every icon stopped working after its window was
            // closed once. So this branch must be able to CREATE a window too,
            // not only focus one.
            if (intent !== 'new' && path === pathname) {
                setWindows((ws) => {
                    const open = ws.find((w) => w.path === path && !w.closing)
                    const z = nextZ(ws)
                    if (open) {
                        return ws.map((w) =>
                            w.key === open.key ? { ...w, minimized: false, zIndex: z } : w
                        )
                    }
                    const live = ws.filter((w) => !w.closing)
                    return [...ws, makeWindow(path, desktopSize(), live.length, z)]
                })
                return
            }
            router.push(path)
        },
        [router, pathname, desktopSize, windowMode]
    )

    const focus = useCallback((key: string) => {
        setWindows((ws) => {
            const z = nextZ(ws)
            return ws.map((w) => (w.key === key ? { ...w, zIndex: z } : w))
        })
    }, [])

    /** Two-step close so the exit animation paints before removal from state. */
    const close = useCallback((key: string) => {
        setWindows((ws) => ws.map((w) => (w.key === key ? { ...w, closing: true } : w)))
        window.setTimeout(() => setWindows((ws) => ws.filter((w) => w.key !== key)), EXIT_MS)
    }, [])

    const closeAll = useCallback(() => {
        setWindows((ws) => ws.map((w) => ({ ...w, closing: true })))
        window.setTimeout(() => setWindows([]), EXIT_MS)
    }, [])

    const update = useCallback((key: string, patch: Partial<AppWindow>) => {
        setWindows((ws) => ws.map((w) => (w.key === key ? { ...w, ...patch } : w)))
    }, [])

    const minimize = useCallback((key: string) => {
        setWindows((ws) => ws.map((w) => (w.key === key ? { ...w, minimized: true } : w)))
    }, [])

    const restore = useCallback((key: string) => {
        setWindows((ws) => {
            const z = nextZ(ws)
            return ws.map((w) => (w.key === key ? { ...w, minimized: false, zIndex: z } : w))
        })
    }, [])

    /**
     * A free window must always have an escape hatch. Dragging is deliberately
     * optional, but once it is enabled a visitor should never have to fight a
     * window back from an edge or an awkward resize. Reset uses the same route
     * geometry as first launch, which is centered and guaranteed to fit.
     */
    const resetWindow = useCallback(
        (key: string) => {
            const d = desktopSize()
            setWindows((ws) =>
                ws.map((w) => {
                    if (w.key !== key) return w
                    const geo = resolveGeometry(w.path, d, 0)
                    // A first-launch route may have a deliberate compositional
                    // offset (Home sits slightly high to leave more wallpaper
                    // below it). A user-requested reset has a clearer promise:
                    // put the window in the literal centre of the desktop.
                    const position = {
                        x: Math.max(0, Math.round((d.width - geo.size.width) / 2)),
                        y: Math.max(0, Math.round((d.height - geo.size.height) / 2)),
                    }
                    return {
                        ...w,
                        size: geo.size,
                        position,
                        previousSize: geo.size,
                        previousPosition: position,
                        minimized: false,
                        maximized: false,
                        snapped: false as Snapped,
                    }
                })
            )
        },
        [desktopSize]
    )

    /** Store geometry before changing it, so restore is exact rather than recomputed. */
    const toggleMaximize = useCallback(
        (key: string) => {
            const d = desktopSize()
            setWindows((ws) =>
                ws.map((w) => {
                    if (w.key !== key) return w
                    if (w.maximized) {
                        return {
                            ...w,
                            maximized: false,
                            snapped: false as Snapped,
                            size: w.previousSize,
                            position: w.previousPosition,
                        }
                    }
                    return {
                        ...w,
                        maximized: true,
                        snapped: false as Snapped,
                        previousSize: w.size,
                        previousPosition: w.position,
                        size: { width: d.width, height: d.height },
                        position: { x: 0, y: 0 },
                    }
                })
            )
        },
        [desktopSize]
    )

    const snap = useCallback(
        (key: string, side: Snapped) => {
            const d = desktopSize()
            setWindows((ws) =>
                ws.map((w) => {
                    if (w.key !== key) return w
                    if (!side) {
                        return {
                            ...w,
                            snapped: false,
                            maximized: false,
                            size: w.previousSize,
                            position: w.previousPosition,
                        }
                    }
                    const half = { width: Math.round(d.width / 2), height: d.height }
                    // Only capture previous geometry on the first snap, so
                    // left -> right -> unsnap still restores the original.
                    const restoring = w.snapped || w.maximized
                    return {
                        ...w,
                        snapped: side,
                        maximized: false,
                        previousSize: restoring ? w.previousSize : w.size,
                        previousPosition: restoring ? w.previousPosition : w.position,
                        size: half,
                        position: { x: side === 'left' ? 0 : d.width - half.width, y: 0 },
                    }
                })
            )
        },
        [desktopSize]
    )

    const focusedKey = useMemo(() => {
        const live = windows.filter((w) => !w.minimized && !w.closing)
        if (!live.length) return null
        return live.reduce((a, b) => (a.zIndex > b.zIndex ? a : b)).key
    }, [windows])

    const cycleWallpaper = useCallback(
        () => setWallpaper((w) => (w + 1) % WALLPAPER_COUNT),
        []
    )

    // Keyboard model (architecture doc section 10). Single keys, no modifier,
    // suppressed whenever the user is actually typing.
    useEffect(() => {
        const isTyping = (t: EventTarget | null) => {
            const el = t as HTMLElement | null
            if (!el || !el.tagName) return false
            return (
                ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable
            )
        }

        const onKey = (e: KeyboardEvent) => {
            if (isTyping(e.target)) return

            if (e.key === 'Escape') return setPanel('none')
            if (e.key === ',') return setPanel((p) => (p === 'display' ? 'none' : 'display'))
            if (e.key === '.') return setPanel((p) => (p === 'shortcuts' ? 'none' : 'shortcuts'))
            if (e.key === '\\') {
                e.preventDefault()
                return setMode((m) => (m === 'light' ? 'dark' : 'light'))
            }
            if (e.key === '|') {
                e.preventDefault()
                return cycleWallpaper()
            }
            if (e.key === 't') {
                e.preventDefault()
                return setReduceTransparency((v) => !v)
            }
            if (e.key === 'f') {
                e.preventDefault()
                return setShowFps((v) => !v)
            }

            if (!focusedKey || !e.shiftKey) return

            if (windowMode === 'locked') {
                if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    return toggleMaximize(focusedKey)
                }
                if (e.key === 'W' || e.key === 'w' || e.key === 'X' || e.key === 'x') {
                    e.preventDefault()
                    return e.key.toLowerCase() === 'x' ? closeAll() : close(focusedKey)
                }
                return
            }

            switch (e.key) {
                case 'R':
                case 'r':
                    e.preventDefault()
                    return resetWindow(focusedKey)
                case 'ArrowLeft':
                    e.preventDefault()
                    return snap(focusedKey, 'left')
                case 'ArrowRight':
                    e.preventDefault()
                    return snap(focusedKey, 'right')
                case 'ArrowUp':
                    e.preventDefault()
                    return toggleMaximize(focusedKey)
                case 'ArrowDown':
                    e.preventDefault()
                    return snap(focusedKey, false)
                case 'W':
                case 'w':
                    e.preventDefault()
                    return close(focusedKey)
                case 'X':
                case 'x':
                    e.preventDefault()
                    return closeAll()
            }
        }

        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [focusedKey, snap, toggleMaximize, resetWindow, close, closeAll, cycleWallpaper, windowMode])

    // Keep windows inside the desktop when the viewport shrinks.
    useEffect(() => {
        const onResize = () => {
            if (windowMode === 'locked') return
            const d = desktopSize()
            setWindows((ws) =>
                ws.map((w) => {
                    const size = {
                        width: Math.min(w.size.width, Math.max(w.constraints.min.width, d.width)),
                        height: Math.min(
                            w.size.height,
                            Math.max(w.constraints.min.height, d.height)
                        ),
                    }
                    return {
                        ...w,
                        size,
                        position: {
                            x: Math.min(w.position.x, Math.max(0, d.width - size.width)),
                            y: Math.min(w.position.y, Math.max(0, d.height - size.height)),
                        },
                    }
                })
            )
        }
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [desktopSize, windowMode])

    // Reflect mode, skin, and wallpaper on <html> so the cascade in globals.css
    // resolves. This is the whole theming mechanism: attributes, not variants.
    useEffect(() => {
        const el = document.documentElement
        el.classList.remove('light', 'dark')
        el.classList.add(mode)
        el.dataset.skin = skin
        el.dataset.wallpaper = String(wallpaper)
        el.dataset.transparency = reduceTransparency ? 'opaque' : 'blurred'
    }, [mode, skin, wallpaper, reduceTransparency])

    const value = useMemo<ShellContext>(
        () => ({
            windows,
            windowMode,
            desktopRef,
            focusedKey,
            openPath,
            close,
            closeAll,
            focus,
            minimize,
            restore,
            resetWindow,
            toggleMaximize,
            snap,
            update,
            mode,
            setMode,
            skin,
            setSkin,
            wallpaper,
            cycleWallpaper,
            reduceTransparency,
            setReduceTransparency,
            showFps,
            setShowFps,
            panel,
            setPanel,
        }),
        [
            windows,
            windowMode,
            focusedKey,
            openPath,
            close,
            closeAll,
            focus,
            minimize,
            restore,
            resetWindow,
            toggleMaximize,
            snap,
            update,
            mode,
            skin,
            wallpaper,
            cycleWallpaper,
            reduceTransparency,
            showFps,
            panel,
        ]
    )

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
