'use client'

import clsx from 'clsx'
import { useShell } from './ShellProvider'

/**
 * The bottom dock: open windows, and nothing else.
 *
 * Ported from the archived OS-Template's two-bar layout, which splits
 * responsibilities better than one combined bar:
 *
 *   top bar    navigation and system controls. Stable, always the same items.
 *   bottom bar the open-window list. Volatile, grows and shrinks with use.
 *
 * Mixing the two means the menu items shift position as windows open, which is
 * exactly what a menu bar must never do. Splitting them also matches what people
 * already know from Windows and macOS, so it needs no explanation.
 *
 * This is the ONLY way back to a minimized window, so it is load-bearing rather
 * than decorative: without it, minimize destroys access to the window.
 */
export function Dock() {
    const { windows, focusedKey, restore, focus, close, windowMode } = useShell()
    const open = windows.filter((w) => !w.closing)

    // An empty dock is just a bar of dead space, so it collapses out of layout.
    if (windowMode === 'locked' || !open.length) return null

    return (
        <div
            data-scheme="secondary"
            className="chrome-taskbar relative z-40 flex h-11 shrink-0 items-center gap-1.5 overflow-x-auto border-t border-border pl-16 pr-2"
        >
            {open.map((w) => (
                <div
                    key={w.key}
                    className={clsx(
                        'group flex shrink-0 items-center gap-1 rounded border px-2 py-1 text-[12px]',
                        'transition-colors duration-100',
                        w.key === focusedKey
                            ? 'border-accent bg-accent text-accent-fg'
                            : 'border-border text-muted hover:text-content',
                        w.minimized && 'italic opacity-60'
                    )}
                >
                    <button
                        type="button"
                        onClick={() => (w.minimized ? restore(w.key) : focus(w.key))}
                        className="max-w-44 truncate outline-none"
                        aria-label={`${w.minimized ? 'Restore' : 'Focus'} ${w.title}`}
                    >
                        {w.title}
                    </button>
                    <button
                        type="button"
                        onClick={() => close(w.key)}
                        aria-label={`Close ${w.title}`}
                        className="grid size-3.5 place-items-center rounded-sm opacity-0 transition-opacity duration-100 group-hover:opacity-70 hover:!opacity-100 focus-visible:opacity-100"
                    >
                        <svg width="7" height="7" viewBox="0 0 8 8" aria-hidden>
                            <path
                                d="M1 1l6 6M7 1l-6 6"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                fill="none"
                            />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    )
}
