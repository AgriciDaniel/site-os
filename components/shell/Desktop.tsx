'use client'

import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useDraggable,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import clsx from 'clsx'
import { useShell } from './ShellProvider'
import { DesktopArt, type IconName } from './icons'

/**
 * The desktop: wallpaper, icons, and the right-click menu.
 * Equivalent to PostHog's Desktop component (architecture doc section 2).
 *
 * DRAG BEHAVIOUR, AND THE THREE THINGS THAT MADE IT FEEL BROKEN
 *
 * The position maths was correct from the start: a 200x120 drag moved an icon
 * exactly 200x120. What felt wrong was everything around the maths.
 *
 *  1. NO ACTIVATION CONSTRAINT. dnd-kit started dragging on the first pixel of
 *     movement, so the small mouse drift everyone produces while clicking dragged
 *     the icon instead of opening it. Automated tests never catch this, because a
 *     scripted click moves zero pixels. Fixed with `distance: 6`: under that
 *     threshold the gesture stays a click.
 *  2. NO GRID. Free positioning left icons a few pixels out of line with each
 *     other, which reads as sloppy rather than as freedom. Drops now snap to a
 *     grid, which is what every real desktop does and why theirs look tidy.
 *  3. NO LIFT. Nothing showed the icon was airborne. It now scales, takes a
 *     shadow, and raises its z-index while dragging.
 *
 * A KeyboardSensor is included so icons can be moved without a pointer, closing
 * one of the accessibility gaps listed in the design system spec.
 */

interface IconDef {
    id: string
    label: string
    path: string
    art: IconName
    /** Starting edge. Both edges are populated, as in the reference. */
    side: 'left' | 'right'
    /** Starting slot down that edge, 0-based. */
    slot: number
}

/**
 * Labels mix two registers on purpose: filename style where the target reads as a
 * DOCUMENT, plain names where it reads as an APP. Naming everything `thing.ext`
 * is a costume; naming documents after files is a cue.
 */
const ICONS: IconDef[] = [
    { id: 'home', label: 'home.mdx', path: '/', art: 'home', side: 'left', slot: 0 },
    { id: 'products', label: 'Products', path: '/products', art: 'products', side: 'left', slot: 1 },
    { id: 'pricing', label: 'Pricing', path: '/pricing', art: 'pricing', side: 'left', slot: 2 },
    { id: 'notes', label: 'notes.md', path: '/notes', art: 'notes', side: 'left', slot: 3 },
    { id: 'terminal', label: 'Terminal', path: '/terminal', art: 'terminal', side: 'left', slot: 4 },
    { id: 'about', label: 'about.txt', path: '/about', art: 'about', side: 'right', slot: 0 },
    { id: 'update', label: 'Update', path: '/system-update', art: 'update', side: 'right', slot: 1 },
    { id: 'trash', label: 'Trash', path: '/trash', art: 'trash', side: 'right', slot: 2 },
]

/** Icon grid in pixels. Drops snap to this, which is what keeps columns tidy. */
const CELL = { w: 96, h: 100 }
const EDGE = 16
const TOP = 12

/** A position of `null` means "still parked at its default slot". */
type Pos = { x: number; y: number }

/**
 * Wallpapers built from CSS gradients, so the scaffold ships no binary assets and
 * nothing to license. Layered rather than flat: scanlines, a base wash, two
 * coloured pools, and a soft horizon, which gives the frosted chrome something
 * worth blurring. Swap these for artwork you own.
 *
 * THE SCANLINES ARE PART OF THIS STACK ON PURPOSE.
 *
 * They were first drawn as a separate full-viewport element using
 * `mix-blend-mode`. Measured cost of that during an icon drag: average frame
 * 19.7ms, 95th percentile 33.4ms, 7 of 39 frames over 32ms, so visibly dropped
 * frames. Disabling that one element took the same drag to a flat 16.7ms with
 * zero janky frames.
 *
 * The reason is that a full-viewport blended layer forces the browser to
 * re-blend the whole desktop every frame anything above it moves. Window drags
 * escaped it because windows are compositor-promoted and move by transform;
 * icons were not promoted, so each frame repainted inside the blended surface.
 *
 * Folding the scanlines into this gradient stack removes the extra element, the
 * blend, and the per-frame cost, and looks the same.
 */
const WALLPAPERS = [
    'repeating-linear-gradient(0deg, rgba(0,0,0,0.035) 0px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px, rgba(0,0,0,0.035) 4px), radial-gradient(120% 80% at 18% 12%, #d9e2f7 0%, transparent 55%), radial-gradient(90% 70% at 85% 78%, #e9dcf2 0%, transparent 55%), radial-gradient(140% 60% at 50% 108%, #cfd8ec 0%, transparent 60%), linear-gradient(168deg, #f2f5fb 0%, #dfe5f1 100%)',
    'repeating-linear-gradient(0deg, rgba(0,0,0,0.035) 0px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px, rgba(0,0,0,0.035) 4px), radial-gradient(120% 80% at 78% 16%, #cfe8dd 0%, transparent 55%), radial-gradient(90% 70% at 18% 82%, #ece5cb 0%, transparent 55%), radial-gradient(140% 60% at 50% 108%, #cdded4 0%, transparent 60%), linear-gradient(196deg, #f1f7f3 0%, #dde9e2 100%)',
    'repeating-linear-gradient(0deg, rgba(0,0,0,0.035) 0px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px, rgba(0,0,0,0.035) 4px), radial-gradient(120% 80% at 26% 78%, #f0d9dd 0%, transparent 55%), radial-gradient(90% 70% at 80% 18%, #d7dcf3 0%, transparent 55%), radial-gradient(140% 60% at 50% 108%, #e0d6e6 0%, transparent 60%), linear-gradient(148deg, #f7f1f4 0%, #e6e0ec 100%)',
]

const WALLPAPERS_DARK = [
    'repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0) 1px, rgba(255,255,255,0) 3px, rgba(255,255,255,0.035) 4px), radial-gradient(120% 80% at 18% 12%, #232b42 0%, transparent 55%), radial-gradient(90% 70% at 85% 78%, #2c2340 0%, transparent 55%), radial-gradient(140% 60% at 50% 108%, #1b2133 0%, transparent 60%), linear-gradient(168deg, #14161f 0%, #1b1f2b 100%)',
    'repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0) 1px, rgba(255,255,255,0) 3px, rgba(255,255,255,0.035) 4px), radial-gradient(120% 80% at 78% 16%, #17322b 0%, transparent 55%), radial-gradient(90% 70% at 18% 82%, #2c2a1d 0%, transparent 55%), radial-gradient(140% 60% at 50% 108%, #16241f 0%, transparent 60%), linear-gradient(196deg, #101613 0%, #18211c 100%)',
    'repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0) 1px, rgba(255,255,255,0) 3px, rgba(255,255,255,0.035) 4px), radial-gradient(120% 80% at 26% 78%, #33222a 0%, transparent 55%), radial-gradient(90% 70% at 80% 18%, #222741 0%, transparent 55%), radial-gradient(140% 60% at 50% 108%, #2a2233 0%, transparent 60%), linear-gradient(148deg, #17131a 0%, #201b26 100%)',
]

function DesktopIcon({
    icon,
    pos,
    selected,
    onSelect,
    locked,
}: {
    icon: IconDef
    pos: Pos
    selected: boolean
    onSelect: () => void
    locked: boolean
}) {
    const { openPath } = useShell()
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: icon.id,
        disabled: locked,
    })

    return (
        <button
            ref={setNodeRef}
            type="button"
            data-icon={icon.id}
            {...(locked ? {} : attributes)}
            {...(locked ? {} : listeners)}
            onClick={() => {
                if (locked) openPath(icon.path, { intent: 'launch' })
                else onSelect()
            }}
            onDoubleClick={() => {
                if (!locked) openPath(icon.path, { intent: 'launch' })
            }}
            title={`${icon.label} (${locked ? 'click' : 'double-click'} to open)`}
            style={{
                left: pos.x,
                top: pos.y,
                // Slightly narrower than the grid cell, but wide enough that a
                // label like "home.mdx" is not truncated to "home.m...".
                width: CELL.w - 8,
                transform: transform
                    ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(1.06)`
                    : undefined,
                // Promote to its own layer only while airborne, then release it.
                // Without this the icon repaints inside the desktop layer each
                // frame; with it the move is a pure compositor transform.
                willChange: isDragging ? 'transform' : undefined,
            }}
            className={clsx(
                'absolute flex flex-col items-center gap-1 rounded-lg p-2 outline-none',
                'transition-[background-color,box-shadow] duration-100',
                isDragging
                    ? 'z-50 cursor-grabbing shadow-2xl'
                    : 'z-0 cursor-default hover:bg-primary/35',
                selected && !isDragging && 'bg-accent/25 ring-1 ring-accent',
                'focus-visible:ring-2 focus-visible:ring-accent'
            )}
        >
            <DesktopArt name={icon.art} />
            <span
                className={clsx(
                    'max-w-full truncate rounded px-1 py-0.5 text-[11px] font-medium leading-tight',
                    // The label needs its own backing plate. Text sitting directly
                    // on a wallpaper is unreadable over a light or busy patch.
                    selected
                        ? 'bg-accent text-accent-fg'
                        : 'bg-primary/75 text-content backdrop-blur-sm'
                )}
            >
                {icon.label}
            </span>
        </button>
    )
}

export function Desktop() {
    const {
        mode,
        wallpaper,
        cycleWallpaper,
        setMode,
        closeAll,
        openPath,
        skin,
        setSkin,
        windowMode,
    } = useShell()
    const locked = windowMode === 'locked'

    const surfaceRef = useRef<HTMLDivElement | null>(null)
    const [surface, setSurface] = useState({ w: 1280, h: 800 })
    const [moved, setMoved] = useState<Record<string, Pos>>({})
    const [selected, setSelected] = useState<string | null>(null)

    // A drag must travel 6px before it counts as a drag. Below that the gesture
    // stays a click, so double-click-to-open survives ordinary hand tremor.
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor)
    )

    // Measure the surface so the right-hand column stays anchored to the right
    // edge at any width, without storing a position that goes stale on resize.
    useEffect(() => {
        const el = surfaceRef.current
        if (!el) return
        const read = () => setSurface({ w: el.clientWidth, h: el.clientHeight })
        read()
        const ro = new ResizeObserver(read)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const defaultPos = useCallback(
        (icon: IconDef): Pos => {
            // On a phone the desktop becomes a familiar three-column launcher.
            // On tablet and desktop the edge columns leave a reading lane for
            // the locked route window.
            if (locked && surface.w <= 767) {
                const index = ICONS.findIndex((candidate) => candidate.id === icon.id)
                const columnWidth = surface.w / 3
                return {
                    x: Math.max(0, columnWidth * (index % 3) + (columnWidth - (CELL.w - 8)) / 2),
                    y: TOP + Math.floor(index / 3) * CELL.h,
                }
            }
            return {
                x: icon.side === 'left' ? EDGE : Math.max(EDGE, surface.w - CELL.w - EDGE),
                y: TOP + icon.slot * CELL.h,
            }
        },
        [surface.w, locked]
    )

    const onDragEnd = useCallback(
        (e: DragEndEvent) => {
            const id = String(e.active.id)
            const icon = ICONS.find((i) => i.id === id)
            if (!icon) return

            const from = moved[id] ?? defaultPos(icon)
            const snap = (v: number, cell: number, origin: number) =>
                origin + Math.round((v - origin) / cell) * cell

            setMoved((prev) => ({
                ...prev,
                [id]: {
                    x: Math.min(
                        Math.max(EDGE, snap(from.x + e.delta.x, CELL.w, EDGE)),
                        Math.max(EDGE, surface.w - CELL.w)
                    ),
                    y: Math.min(
                        Math.max(TOP, snap(from.y + e.delta.y, CELL.h, TOP)),
                        Math.max(TOP, surface.h - CELL.h)
                    ),
                },
            }))
        },
        [moved, defaultPos, surface.w, surface.h]
    )

    const bg = (mode === 'dark' ? WALLPAPERS_DARK : WALLPAPERS)[wallpaper] ?? WALLPAPERS[0]

    return (
        <ContextMenu.Root>
            <ContextMenu.Trigger asChild>
                <div
                    id="desktop-surface"
                    ref={surfaceRef}
                    onPointerDown={(e) => {
                        // Clicking bare desktop clears the selection.
                        if (!(e.target as HTMLElement).closest('[data-icon]')) setSelected(null)
                    }}
                    className="desktop-layer absolute inset-0 overflow-hidden"
                    style={{ backgroundImage: bg }}
                >

                    <DndContext
                        sensors={sensors}
                        onDragEnd={onDragEnd}
                        modifiers={[restrictToParentElement]}
                    >
                        {ICONS.map((icon) => (
                            <DesktopIcon
                                key={icon.id}
                                icon={icon}
                                pos={locked ? defaultPos(icon) : (moved[icon.id] ?? defaultPos(icon))}
                                selected={selected === icon.id}
                                onSelect={() => setSelected(icon.id)}
                                locked={locked}
                            />
                        ))}
                    </DndContext>
                </div>
            </ContextMenu.Trigger>

            <ContextMenu.Portal>
                <ContextMenu.Content
                    data-scheme="secondary"
                    className="animate-overlay-fade-in min-w-52 rounded-md border border-border bg-primary/95 p-1 shadow-2xl backdrop-blur-chrome"
                >
                    <MenuItem onSelect={cycleWallpaper}>Change wallpaper</MenuItem>
                    <MenuItem onSelect={() => setMode(mode === 'light' ? 'dark' : 'light')}>
                        {mode === 'light' ? 'Dark mode' : 'Light mode'}
                    </MenuItem>
                    <MenuItem onSelect={() => setSkin(skin === 'modern' ? 'classic' : 'modern')}>
                        {skin === 'modern' ? 'Classic skin' : 'Modern skin'}
                    </MenuItem>
                    <ContextMenu.Separator className="my-1 h-px bg-border" />
                    <MenuItem onSelect={() => setMoved({})}>Tidy icons</MenuItem>
                    <MenuItem onSelect={() => openPath('/terminal', { intent: 'launch' })}>
                        Open Terminal
                    </MenuItem>
                    <MenuItem onSelect={closeAll}>Close all windows</MenuItem>
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu.Root>
    )
}

function MenuItem({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) {
    return (
        <ContextMenu.Item
            onSelect={onSelect}
            className="cursor-default select-none rounded px-2 py-1.5 text-[13px] outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-fg"
        >
            {children}
        </ContextMenu.Item>
    )
}
