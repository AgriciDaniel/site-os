'use client'

import { motion, useDragControls, useMotionValue, type PanInfo } from 'framer-motion'
import { useCallback, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import clsx from 'clsx'
import { useShell } from './ShellProvider'
import { WindowProvider } from './WindowContext'
import { renderApp } from '@/lib/apps'
import type { AppWindow as AppWindowType, Snapped } from '@/lib/types'

/**
 * One window. Ported from the mechanics in ../study/os-shell-architecture.md
 * section 4.
 *
 * A window must be dragged genuinely PAST the desktop edge to snap, not merely
 * near it. Hence a negative threshold: accidental snapping while moving a window
 * to the side of the screen is the single most annoying failure mode in a
 * windowing UI, and a positive "within 50px" test causes it constantly.
 */
const SNAP_THRESHOLD = -50

/**
 * Traffic-light fills for the `classic` skin, in chrome-button order.
 *
 * These use PROJECT tokens, not stock Tailwind scales, and that is load-bearing
 * rather than stylistic. The first version wrote `bg-amber-400`, which silently
 * produced no background at all: `tailwind.config.ts` defines `amber` as a flat
 * colour, and a flat definition REPLACES the stock 50-950 scale, so
 * `bg-amber-400` stops existing. `emerald` and `rose` were not redefined, so
 * those two worked and only minimize was invisible. Mixing stock scales with
 * custom flat tokens fails exactly this quietly, which is why the design system
 * bans stock colours outright.
 */
const TRAFFIC: Record<string, string> = {
    minimize: 'bg-amber hover:opacity-100',
    maximize: 'bg-mint hover:opacity-100',
    close: 'bg-coral hover:opacity-100',
}

/** Resize handles. Each records which edges it moves. */
const HANDLES = [
    { dir: 'n', cls: 'top-0 left-3 right-3 h-1.5 cursor-ns-resize' },
    { dir: 's', cls: 'bottom-0 left-3 right-3 h-1.5 cursor-ns-resize' },
    { dir: 'w', cls: 'left-0 top-3 bottom-3 w-1.5 cursor-ew-resize' },
    { dir: 'e', cls: 'right-0 top-3 bottom-3 w-1.5 cursor-ew-resize' },
    { dir: 'nw', cls: 'top-0 left-0 size-3 cursor-nwse-resize' },
    { dir: 'ne', cls: 'top-0 right-0 size-3 cursor-nesw-resize' },
    { dir: 'sw', cls: 'bottom-0 left-0 size-3 cursor-nesw-resize' },
    { dir: 'se', cls: 'bottom-0 right-0 size-3 cursor-nwse-resize' },
] as const

function SnapIndicator({ side }: { side: Exclude<Snapped, false> }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={clsx(
                'absolute top-0 bottom-0 w-1/2 rounded-window bg-accent pointer-events-none',
                side === 'left' ? 'left-0' : 'right-0'
            )}
            style={{ zIndex: 5 }}
        />
    )
}

export function AppWindow({ item }: { item: AppWindowType }) {
    const {
        focus,
        close,
        minimize,
        toggleMaximize,
        snap,
        update,
        desktopRef,
        focusedKey,
        skin,
        windowMode,
    } = useShell()
    const isFree = windowMode === 'free'
    const isClassic = skin === 'classic'
    const controls = useDragControls()
    const dragX = useMotionValue(0)
    const dragY = useMotionValue(0)

    const [dragging, setDragging] = useState(false)
    const [resizing, setResizing] = useState(false)
    const [snapIndicator, setSnapIndicator] = useState<Exclude<Snapped, false> | null>(null)

    const isFocused = focusedKey === item.key

    // Promote to a compositor layer only while something is actually moving.
    // Permanently promoting every window wastes GPU memory for no benefit.
    const compositing = dragging || resizing || item.closing

    const desktopRect = useCallback(
        () => desktopRef.current?.getBoundingClientRect() ?? null,
        [desktopRef]
    )

    const clampSize = useCallback(
        (w: number, h: number) => ({
            width: Math.min(Math.max(w, item.constraints.min.width), item.constraints.max.width),
            height: Math.min(Math.max(h, item.constraints.min.height), item.constraints.max.height),
        }),
        [item.constraints]
    )

    const onDrag = useCallback(
        (_e: unknown, info: PanInfo) => {
            if (!dragging) setDragging(true)
            const bounds = desktopRect()
            if (!bounds) return

            const newX = item.position.x + info.offset.x

            // Past the left edge, or past the right edge, by more than the threshold.
            if (newX < SNAP_THRESHOLD) setSnapIndicator('left')
            else if (newX > bounds.width - item.size.width - SNAP_THRESHOLD)
                setSnapIndicator('right')
            else setSnapIndicator(null)
        },
        [dragging, desktopRect, item.position.x, item.size.width]
    )

    const onDragEnd = useCallback(
        (_e: unknown, info: PanInfo) => {
            setDragging(false)

            if (snapIndicator && !item.fixedSize) {
                // Commit the snapped geometry before clearing the transient
                // translation so both changes land in the same browser frame.
                flushSync(() => snap(item.key, snapIndicator))
                dragX.set(0)
                dragY.set(0)
                setSnapIndicator(null)
                return
            }
            setSnapIndicator(null)

            const bounds = desktopRect()
            if (!bounds) {
                dragX.set(0)
                dragY.set(0)
                return
            }

            // Framer supplies the responsive, compositor-only movement while
            // the pointer is down. At release, commit that offset to the
            // source-of-truth geometry and clear the transient transform in
            // the same frame so the window neither jumps back nor moves twice.
            flushSync(() =>
                update(item.key, {
                    position: {
                        x: Math.min(
                            Math.max(0, item.position.x + info.offset.x),
                            Math.max(0, bounds.width - item.size.width)
                        ),
                        y: Math.min(
                            Math.max(0, item.position.y + info.offset.y),
                            Math.max(0, bounds.height - item.size.height)
                        ),
                    },
                    snapped: false,
                })
            )
            dragX.set(0)
            dragY.set(0)
        },
        [snapIndicator, item, snap, update, desktopRect, dragX, dragY]
    )

    /**
     * Resize. The west and north handles are the ones that get implemented
     * wrong: growing leftward means the width delta is INVERTED and the x
     * position must move by exactly the amount the width changed, so the
     * opposite edge stays put.
     */
    const onResize = useCallback(
        (dir: (typeof HANDLES)[number]['dir'], info: PanInfo) => {
            const west = dir.includes('w')
            const north = dir.includes('n')
            const horizontal = dir.includes('w') || dir.includes('e')
            const vertical = dir.includes('n') || dir.includes('s')

            const dw = horizontal ? (west ? -info.delta.x : info.delta.x) : 0
            const dh = vertical ? (north ? -info.delta.y : info.delta.y) : 0

            const size = clampSize(item.size.width + dw, item.size.height + dh)
            const position = { ...item.position }

            // Correct the position by the ACTUAL applied delta, which may be
            // smaller than requested once constraints clamp it. Using the
            // requested delta here is what makes constrained resizes drift.
            if (west) position.x = item.position.x + (item.size.width - size.width)
            if (north) position.y = item.position.y + (item.size.height - size.height)

            update(item.key, { size, position, snapped: false, maximized: false })
        },
        [item, clampSize, update]
    )

    const chromeButtons = useMemo(
        () => {
            const common = [
                { label: 'Maximize', onClick: () => toggleMaximize(item.key), glyph: 'maximize' },
                { label: 'Close', onClick: () => close(item.key), glyph: 'close' },
            ]
            return isFree
                ? [
                      { label: 'Minimize', onClick: () => minimize(item.key), glyph: 'minimize' },
                      ...common,
                  ]
                : common
        },
        [item.key, minimize, toggleMaximize, close, isFree]
    )

    if (item.minimized) return null

    return (
        <>
            {isFree && snapIndicator && <SnapIndicator side={snapIndicator} />}

            <motion.div
                // The window is a container-query root. Everything inside sizes
                // against the WINDOW, never the viewport, because a window is
                // resizable and the viewport tells its contents nothing.
                data-scheme="tertiary"
                data-app="AppWindow"
                data-window-mode={windowMode}
                data-snapped={item.snapped || undefined}
                data-focused={isFocused || undefined}
                className={clsx(
                    '@container absolute flex flex-col overflow-hidden',
                    'chrome-window border border-border',
                    isClassic ? 'rounded' : 'rounded-window',
                    isFocused ? 'shadow-2xl' : 'shadow-md',
                    !isFree && 'locked-window',
                    !isFree && item.maximized && 'locked-window-maximized',
                    compositing && 'compositing',
                    item.closing ? 'animate-window-pop-out' : 'animate-window-pop-in'
                )}
                style={
                    isFree
                        ? {
                              left: item.position.x,
                              top: item.position.y,
                              width: item.size.width,
                              height: item.size.height,
                              zIndex: item.zIndex,
                              x: dragX,
                              y: dragY,
                          }
                        : { zIndex: item.zIndex }
                }
                drag={isFree && !item.maximized}
                dragListener={false}
                dragControls={controls}
                dragMomentum={false}
                dragElastic={0}
                dragConstraints={desktopRef}
                onDrag={onDrag}
                onDragEnd={onDragEnd}
                onPointerDownCapture={() => {
                    if (!isFocused) focus(item.key)
                }}
            >
                {/* Header bar: the drag handle. Dragging from the whole surface
                    would make selecting text inside the window impossible. */}
                <div
                    data-scheme="tertiary"
                    onPointerDown={(e) => {
                        if (isFree && !item.maximized) controls.start(e)
                    }}
                    onDoubleClick={() => {
                        if (isFree) toggleMaximize(item.key)
                    }}
                    className={clsx(
                        'flex h-9 shrink-0 items-center gap-2 border-b border-border px-3',
                        isFree && !item.maximized && 'cursor-grab active:cursor-grabbing',
                        'select-none'
                    )}
                >
                    <span
                        className={clsx(
                            'truncate text-[13px] font-semibold',
                            isFocused ? 'text-content' : 'text-muted'
                        )}
                    >
                        {item.title}
                    </span>

                    {/* Window controls. The `classic` skin swaps the neutral
                        squares for coloured traffic lights, an idea taken from the
                        archived OS-Template. Both variants keep the same order and
                        the same aria-labels, so only the paint changes: the colours
                        are never the sole carrier of meaning, and the glyph still
                        shows on hover for anyone who cannot separate the hues. */}
                    <div className="ml-auto flex items-center gap-1">
                        {chromeButtons.map((b) => (
                            <button
                                key={b.glyph}
                                type="button"
                                aria-label={`${b.label} window`}
                                onClick={b.onClick}
                                className={clsx(
                                    b.glyph === 'maximize' && 'locked-mobile-hide',
                                    'grid place-items-center transition-colors duration-100',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                                    isClassic
                                        ? [
                                              'size-3.5 rounded-full border border-black/20 text-black/60',
                                              'opacity-90 hover:opacity-100',
                                              TRAFFIC[b.glyph],
                                          ]
                                        : [
                                              'size-5 rounded border border-border text-muted',
                                              'hover:border-accent hover:bg-accent hover:text-accent-fg',
                                          ]
                                )}
                            >
                                <span className={isClassic ? 'opacity-0 hover:opacity-100' : ''}>
                                    <Glyph kind={b.glyph} />
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* App content. `min-h-0` is load-bearing: without it a flex child
                    refuses to shrink and the scroll area never scrolls. */}
                <div data-scheme="primary" className="relative flex min-h-0 flex-1 flex-col">
                    <ScrollArea.Root className="min-h-0 flex-1 overflow-hidden" type="hover">
                        <ScrollArea.Viewport className="app-scroll-viewport">
                            <WindowProvider window={item}>
                                {/* Resolved by path, NOT from a stored `children`.
                                    See lib/apps.tsx for why that distinction matters. */}
                                <div className="p-4 @md:p-6 @xl:p-8">{renderApp(item.path)}</div>
                            </WindowProvider>
                        </ScrollArea.Viewport>
                        <ScrollArea.Scrollbar
                            orientation="vertical"
                            className="flex w-2.5 touch-none select-none p-0.5"
                        >
                            <ScrollArea.Thumb className="flex-1 rounded-full bg-border" />
                        </ScrollArea.Scrollbar>
                    </ScrollArea.Root>
                </div>

                {/* Resize handles, suppressed when the window cannot be resized. */}
                {isFree && !item.fixedSize && !item.maximized && (
                    <>
                        {HANDLES.map((h) => (
                            <motion.div
                                key={h.dir}
                                role="presentation"
                                className={clsx('absolute z-10', h.cls)}
                                drag
                                dragMomentum={false}
                                dragElastic={0}
                                // Snap the handle back each frame so it tracks the
                                // pointer as a delta source rather than drifting away.
                                dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                                onDragStart={() => setResizing(true)}
                                onDrag={(_e, info) => onResize(h.dir, info)}
                                onDragEnd={() => setResizing(false)}
                            />
                        ))}
                    </>
                )}
            </motion.div>
        </>
    )
}

function Glyph({ kind }: { kind: string }) {
    const common = { width: 8, height: 8, viewBox: '0 0 8 8', 'aria-hidden': true } as const
    if (kind === 'close')
        return (
            <svg {...common}>
                <path d="M1 1l6 6M7 1l-6 6" stroke="currentColor" strokeWidth="1.4" fill="none" />
            </svg>
        )
    if (kind === 'minimize')
        return (
            <svg {...common}>
                <path d="M1 6h6" stroke="currentColor" strokeWidth="1.4" fill="none" />
            </svg>
        )
    return (
        <svg {...common}>
            <rect x="1" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
    )
}
