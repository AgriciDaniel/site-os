import type { AppSetting, Position, Size } from './types'

/**
 * Per-route window geometry.
 *
 * Keeping this in one table rather than on each page means window behavior is
 * reviewable in a single place, and a new page inherits sane defaults by simply
 * not appearing here.
 */
/**
 * Horizontal space the desktop icon columns occupy, so a window never opens on
 * top of them. Kept here rather than in Desktop.tsx because it is the WINDOW
 * layout that has to respect it.
 */
export const ICON_GUTTER = 120
export const TOP_INSET = 12

export const DEFAULT_SIZE: Size = { width: 1080, height: 760 }
export const DEFAULT_MIN: Size = { width: 420, height: 320 }
export const DEFAULT_MAX: Size = { width: 2200, height: 1600 }

export const appSettings: Record<string, AppSetting> = {
    '/': {
        title: 'Home',
        size: { default: { width: 1100, height: 780 }, min: { width: 640, height: 460 } },
        position: {
            // Centre, but never over the desktop icon columns.
            //
            // The first version nudged the window LEFT to "keep the wallpaper
            // visible", which did the opposite of what was intended: it parked the
            // window on top of the left icon column and hid it completely. The
            // desktop is part of the composition, so the default window position
            // has to clear the furniture on both edges.
            getPositionDefaults: (size, _open, desktopCenter) => {
                const c = desktopCenter(size)
                return { x: Math.max(ICON_GUTTER, c.x), y: Math.max(TOP_INSET, c.y - 24) }
            },
        },
    },
    '/products': {
        title: 'Products',
        size: { default: { width: 1000, height: 700 }, min: { width: 520, height: 400 } },
    },
    '/pricing': {
        title: 'Pricing',
        size: { default: { width: 940, height: 720 } },
    },
    '/about': {
        title: 'About',
        size: { default: { width: 860, height: 640 } },
    },
    '/terminal': {
        title: 'Terminal',
        size: { default: { width: 760, height: 460 }, min: { width: 360, height: 240 } },
    },
    '/system-update': {
        // Fixed size: a progress dialog that can be resized looks like a bug.
        title: 'System update',
        size: { default: { width: 460, height: 340 }, fixed: true },
        position: { center: true },
    },
    '/trash': {
        title: 'Trash',
        size: { default: { width: 560, height: 400 } },
    },
    '/notes': {
        title: 'Notes',
        size: { default: { width: 620, height: 520 }, min: { width: 320, height: 260 } },
    },
}

export function settingsFor(path: string): AppSetting {
    return appSettings[path] ?? {}
}

/** Resolve a route's geometry, cascading route config over the defaults. */
export function resolveGeometry(
    path: string,
    desktop: Size,
    openCount: number
): { size: Size; position: Position; constraints: { min: Size; max: Size }; fixedSize: boolean } {
    const s = settingsFor(path)

    const min = { ...DEFAULT_MIN, ...(s.size?.min ?? {}) }
    const max = { ...DEFAULT_MAX, ...(s.size?.max ?? {}) }

    // Never open a window larger than the desktop that has to hold it.
    const wanted = { ...DEFAULT_SIZE, ...(s.size?.default ?? {}) }
    const size: Size = {
        width: Math.min(Math.max(wanted.width, min.width), Math.max(min.width, desktop.width - 48)),
        height: Math.min(
            Math.max(wanted.height, min.height),
            Math.max(min.height, desktop.height - 48)
        ),
    }

    const desktopCenter = (sz: Size): Position => ({
        x: Math.max(0, Math.round((desktop.width - sz.width) / 2)),
        y: Math.max(0, Math.round((desktop.height - sz.height) / 2)),
    })

    let position: Position
    if (s.position?.getPositionDefaults) {
        position = s.position.getPositionDefaults(size, [], desktopCenter)
    } else {
        // Cascade each additional window so a stack stays legible.
        const c = desktopCenter(size)
        const step = 28 * Math.min(openCount, 6)
        position = { x: c.x + step, y: c.y + step }
    }

    // Clamp inside the desktop.
    position = {
        x: Math.min(Math.max(0, position.x), Math.max(0, desktop.width - size.width)),
        y: Math.min(Math.max(0, position.y), Math.max(0, desktop.height - size.height)),
    }

    return { size, position, constraints: { min, max }, fixedSize: s.size?.fixed ?? false }
}
