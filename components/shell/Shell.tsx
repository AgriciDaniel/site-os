'use client'

import { useEffect, useState } from 'react'
import { useShell } from './ShellProvider'
import { AppWindow } from './AppWindow'
import { Desktop } from './Desktop'
import { Taskbar } from './Taskbar'
import { Dock } from './Dock'
import { ShortcutsPanel } from './ShortcutsPanel'
import { FpsMeter } from './FpsMeter'

/**
 * The desktop layout. Equivalent to PostHog's Wrapper (architecture doc
 * section 2), which is worth mirroring closely because its shape carries three
 * decisions:
 *
 *   1. `desktopRef` wraps only the area BELOW the taskbar, and it is the drag
 *      boundary. Windows therefore cannot be dragged under the menu bar, and
 *      that constraint comes from layout rather than a magic number.
 *   2. Exit animation is owned by the provider, not by AnimatePresence. A
 *      closing window is flagged `closing`, renders the CSS pop-out keyframes,
 *      and is dropped from state 160ms later.
 *
 *      PostHog wraps this list in `AnimatePresence` because their exits are
 *      framer variants. Ours are CSS keyframe classes, and running both at once
 *      is an actual bug: AnimatePresence kept a removed window mounted forever,
 *      so state.length went to 0 while the DOM still showed a window. One
 *      mechanism has to own the exit. Here it is the provider.
 *
 *   3. The window list is FLAT. Stacking is a zIndex number per window, never
 *      DOM nesting, so any window can be raised without reparenting anything.
 */
export function Shell() {
    const { windows, desktopRef, windowMode } = useShell()

    return (
        <div
            className="shell-root flex h-dvh flex-col overflow-hidden"
            data-window-mode={windowMode}
            // Introspection for tests: minimized windows render null, so a DOM
            // count of window elements does not equal the window count in state.
            data-window-count={windows.length}
            data-window-keys={windows.map((w) => `${w.key}${w.minimized ? ':min' : ''}${w.closing ? ':closing' : ''}`).join(',')}
        >
            <Taskbar />
            <div ref={desktopRef} className="relative flex-grow overflow-hidden">
                <Desktop />
                {windows.map((w) => (
                    <AppWindow key={w.key} item={w} />
                ))}
            </div>
            <Dock />
            <ShortcutsPanel />
            <FpsMeter />
        </div>
    )
}

/**
 * The mode switch. The OS presentation is now the default at every viewport
 * size; its window manager decides whether the route window is locked or free.
 * `boring` remains an explicit escape hatch and the server-rendered fallback.
 *
 * Because the OS layer is purely additive over real routed pages, turning it
 * off yields a working conventional site rather than a broken one.
 *
 * Rendering rule: the server always renders the plain page and the OS appears
 * after mount. So the HTML a crawler receives is the ordinary document.
 */
export function ExperienceSwitch({
    page,
    children,
}: {
    page: React.ReactNode
    children: React.ReactNode
}) {
    const [experience, setExperience] = useState<'boring' | 'os'>('boring')

    useEffect(() => {
        const decide = () => {
            const forced = new URLSearchParams(window.location.search).get('experience')
            if (forced === 'boring') return setExperience('boring')
            setExperience('os')
        }
        decide()
        window.addEventListener('resize', decide)
        return () => window.removeEventListener('resize', decide)
    }, [])

    if (experience === 'boring') return <BoringLayout>{page}</BoringLayout>
    return <>{children}</>
}

/** The conventional site: a normal header and a normal scrolling document. */
function BoringLayout({ children }: { children: React.ReactNode }) {
    return (
        <div data-scheme="primary" className="min-h-dvh overflow-y-auto bg-primary">
            <header
                data-scheme="secondary"
                className="sticky top-0 z-10 border-b border-border bg-primary/90 backdrop-blur"
            >
                <nav className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-3 text-[14px]">
                    <a href="/" className="font-semibold">
                        Home
                    </a>
                    <a href="/products" className="text-muted hover:text-content">
                        Products
                    </a>
                    <a href="/pricing" className="text-muted hover:text-content">
                        Pricing
                    </a>
                    <a href="/about" className="text-muted hover:text-content">
                        About
                    </a>
                    <a
                        href="?experience=os"
                        className="ml-auto rounded border border-border px-2 py-1 text-[12px] text-muted hover:text-content"
                    >
                        Desktop mode
                    </a>
                </nav>
            </header>
            <main className="mx-auto max-w-3xl px-5 py-8">{children}</main>
        </div>
    )
}
