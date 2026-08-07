export type Snapped = 'left' | 'right' | false
export type WindowMode = 'locked' | 'free'

export interface Size {
    width: number
    height: number
}

export interface Position {
    x: number
    y: number
}

/**
 * One window. Mirrors the shape reverse-engineered in
 * ../study/os-shell-architecture.md section 3.
 *
 * The `previous*` fields are the important design detail: maximize, snap, and
 * restore do not recompute geometry, they store the pre-change geometry and put
 * it back verbatim. That is what makes restore feel exact.
 */
export interface AppWindow {
    key: string
    path: string
    title: string
    zIndex: number
    position: Position
    size: Size
    previousPosition: Position
    previousSize: Size
    minimized: boolean
    maximized: boolean
    snapped: Snapped
    fixedSize: boolean
    constraints: { min: Size; max: Size }
    /** True while the exit animation plays, before removal from state. */
    closing?: boolean
}

/** Per-route window configuration. The `appSettings` analog. */
export interface AppSetting {
    title?: string
    size?: {
        default?: Partial<Size>
        min?: Partial<Size>
        max?: Partial<Size>
        fixed?: boolean
    }
    position?: {
        center?: boolean
        /** Custom placement, given the resolved size and the windows already open. */
        getPositionDefaults?: (
            size: Size,
            openWindows: AppWindow[],
            desktopCenter: (size: Size) => Position
        ) => Position
    }
}
