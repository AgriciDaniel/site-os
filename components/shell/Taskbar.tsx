'use client'

import * as Menubar from '@radix-ui/react-menubar'
import clsx from 'clsx'
import { useShell } from './ShellProvider'

/**
 * The global menu bar. Navigation and system controls only.
 * Equivalent to PostHog's TaskBarMenu (architecture doc section 2).
 *
 * The open-window list deliberately lives in `Dock.tsx` instead, so menu items
 * never shift position as windows open and close.
 *
 * Built on the Radix Menubar primitive, wrapped locally so the OS styling lives
 * in exactly one place. PostHog's own convention is never to import a Radix
 * primitive raw into a page, and it is a good one: it means restyling all menus
 * is a one-file change.
 */

interface MenuDef {
    label: string
    items: { label: string; path?: string; action?: 'theme' | 'wallpaper' | 'closeAll' | 'shortcuts' | 'reset' }[]
}

const MENUS: MenuDef[] = [
    {
        label: 'Site',
        items: [
            { label: 'Home', path: '/' },
            { label: 'About', path: '/about' },
            { label: 'Notes', path: '/notes' },
        ],
    },
    {
        label: 'Products',
        items: [
            { label: 'All products', path: '/products' },
            { label: 'Pricing', path: '/pricing' },
        ],
    },
    {
        label: 'Tools',
        items: [
            { label: 'Terminal', path: '/terminal' },
            { label: 'System update', path: '/system-update' },
        ],
    },
    {
        label: 'View',
        items: [
            { label: 'Toggle theme', action: 'theme' },
            { label: 'Cycle wallpaper', action: 'wallpaper' },
            { label: 'Center/reset focused window', action: 'reset' },
            { label: 'Keyboard shortcuts', action: 'shortcuts' },
            { label: 'Close all windows', action: 'closeAll' },
        ],
    },
]

export function Taskbar() {
    const {
        openPath,
        mode,
        setMode,
        cycleWallpaper,
        closeAll,
        setPanel,
        windowMode,
        focusedKey,
        resetWindow,
    } = useShell()

    const run = (item: MenuDef['items'][number]) => {
        if (item.path) return openPath(item.path, { intent: 'launch' })
        switch (item.action) {
            case 'theme':
                return setMode(mode === 'light' ? 'dark' : 'light')
            case 'wallpaper':
                return cycleWallpaper()
            case 'closeAll':
                return closeAll()
            case 'shortcuts':
                return setPanel('shortcuts')
            case 'reset':
                if (focusedKey) return resetWindow(focusedKey)
        }
    }

    return (
        <div
            data-scheme="primary"
            className="shell-taskbar chrome-taskbar relative z-50 flex h-10 shrink-0 items-center gap-1 border border-border px-2 shadow-2xl"
        >
            <Menubar.Root className="flex items-center gap-0.5">
                {MENUS.map((menu) => (
                    <Menubar.Menu key={menu.label}>
                        <Menubar.Trigger
                            className={clsx(
                                'rounded px-2 py-1 text-[13px] font-medium outline-none',
                                'data-[state=open]:bg-accent data-[state=open]:text-accent-fg',
                                'hover:bg-primary focus-visible:ring-2 focus-visible:ring-accent'
                            )}
                        >
                            {menu.label}
                        </Menubar.Trigger>
                        <Menubar.Portal>
                            <Menubar.Content
                                data-scheme="secondary"
                                align="start"
                                sideOffset={4}
                                className="animate-overlay-fade-in z-[80] min-w-52 rounded-md border border-border bg-primary/95 p-1 shadow-2xl backdrop-blur-chrome"
                            >
                                {menu.items
                                    .filter((item) => item.action !== 'reset' || windowMode === 'free')
                                    .map((item) => (
                                    <Menubar.Item
                                        key={item.label}
                                        onSelect={() => run(item)}
                                        className="cursor-default select-none rounded px-2 py-1.5 text-[13px] outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-fg"
                                    >
                                        {item.label}
                                    </Menubar.Item>
                                ))}
                            </Menubar.Content>
                        </Menubar.Portal>
                    </Menubar.Menu>
                ))}
            </Menubar.Root>

            <div className="ml-auto flex items-center gap-2 text-[12px] text-muted">
                <button
                    type="button"
                    onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
                    aria-label="Toggle color mode"
                    className="rounded border border-border px-2 py-0.5 hover:text-content"
                >
                    {mode === 'light' ? 'Light' : 'Dark'}
                </button>
                <button
                    type="button"
                    onClick={() => setPanel('shortcuts')}
                    aria-label="Keyboard shortcuts"
                    className="rounded border border-border px-2 py-0.5 hover:text-content"
                >
                    ?
                </button>
            </div>
        </div>
    )
}
