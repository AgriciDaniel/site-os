'use client'

import clsx from 'clsx'
import { useShell } from './ShellProvider'

/**
 * The shortcuts and display panels, bound to `.` and `,` respectively
 * (architecture doc section 10).
 *
 * Single-key shortcuts with no modifier only work because the document itself is
 * never a text field. ShellProvider suppresses them whenever focus is inside an
 * input, textarea, select, or contenteditable, which is the one guard that makes
 * the scheme safe.
 */

const SHORTCUTS: [string, string][] = [
    [',', 'Display options'],
    ['.', 'Keyboard shortcuts'],
    ['\\', 'Toggle light and dark'],
    ['|', 'Cycle wallpaper'],
    ['t', 'Reduce transparency'],
    ['f', 'Frame meter'],
    ['Shift + Left', 'Snap window left'],
    ['Shift + Right', 'Snap window right'],
    ['Shift + Up', 'Maximize or restore'],
    ['Shift + Down', 'Unsnap window'],
    ['Shift + R', 'Center/reset focused window'],
    ['Shift + W', 'Close focused window'],
    ['Shift + X', 'Close all windows'],
    ['Esc', 'Dismiss this panel'],
]

export function ShortcutsPanel() {
    const {
        panel, setPanel, mode, setMode, skin, setSkin, cycleWallpaper,
        reduceTransparency, setReduceTransparency, showFps, setShowFps,
    } = useShell()
    if (panel === 'none') return null

    return (
        <>
            {/* Scrim. Clicking it dismisses, which is the behavior people expect
                and is cheaper than trapping focus for a non-critical panel. */}
            <button
                type="button"
                aria-label="Dismiss panel"
                onClick={() => setPanel('none')}
                className="animate-overlay-fade-in fixed inset-0 z-[90] cursor-default bg-black/20"
            />
            <div
                data-scheme="secondary"
                role="dialog"
                aria-modal="true"
                aria-label={panel === 'shortcuts' ? 'Keyboard shortcuts' : 'Display options'}
                className={clsx(
                    'animate-window-pop-in fixed left-1/2 top-1/2 z-[100] w-[min(30rem,90vw)]',
                    '-translate-x-1/2 -translate-y-1/2 rounded-window border border-border',
                    'bg-primary/95 p-5 shadow-2xl backdrop-blur-chrome'
                )}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-[15px] font-semibold">
                        {panel === 'shortcuts' ? 'Keyboard shortcuts' : 'Display options'}
                    </h2>
                    <button
                        type="button"
                        onClick={() => setPanel('none')}
                        className="rounded border border-border px-2 py-0.5 text-[12px] text-muted hover:text-content"
                    >
                        Esc
                    </button>
                </div>

                {panel === 'shortcuts' ? (
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
                        {SHORTCUTS.map(([k, label]) => (
                            <div key={k} className="col-span-2 grid grid-cols-subgrid items-center">
                                <dt>
                                    <kbd
                                        data-scheme="tertiary"
                                        className="rounded border border-border bg-primary px-1.5 py-0.5 font-mono text-[11px]"
                                    >
                                        {k}
                                    </kbd>
                                </dt>
                                <dd className="text-muted">{label}</dd>
                            </div>
                        ))}
                    </dl>
                ) : (
                    <div className="space-y-4 text-[13px]">
                        <Row label="Color mode">
                            <Segmented
                                options={['light', 'dark']}
                                value={mode}
                                onChange={(v) => setMode(v as 'light' | 'dark')}
                            />
                        </Row>
                        <Row label="Skin">
                            <Segmented
                                options={['modern', 'classic']}
                                value={skin}
                                onChange={(v) => setSkin(v as 'modern' | 'classic')}
                            />
                        </Row>
                        <Row label="Reduce transparency">
                            <Segmented
                                options={['off', 'on']}
                                value={reduceTransparency ? 'on' : 'off'}
                                onChange={(v) => setReduceTransparency(v === 'on')}
                            />
                        </Row>
                        <p className="text-[11px] text-muted">
                            Drops all backdrop blur and makes chrome opaque. Try this first if
                            dragging ever stutters: blur is the most expensive thing here.
                        </p>
                        <Row label="Frame meter">
                            <Segmented
                                options={['off', 'on']}
                                value={showFps ? 'on' : 'off'}
                                onChange={(v) => setShowFps(v === 'on')}
                            />
                        </Row>
                        <Row label="Wallpaper">
                            <button
                                type="button"
                                onClick={cycleWallpaper}
                                className="rounded border border-border px-2 py-1 hover:bg-accent hover:text-accent-fg"
                            >
                                Cycle
                            </button>
                        </Row>
                    </div>
                )}
            </div>
        </>
    )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-muted">{label}</span>
            {children}
        </div>
    )
}

function Segmented({
    options,
    value,
    onChange,
}: {
    options: string[]
    value: string
    onChange: (v: string) => void
}) {
    return (
        <div data-scheme="tertiary" className="flex rounded border border-border p-0.5">
            {options.map((o) => (
                <button
                    key={o}
                    type="button"
                    onClick={() => onChange(o)}
                    className={clsx(
                        'rounded px-2 py-0.5 capitalize transition-colors duration-100',
                        value === o ? 'bg-accent text-accent-fg' : 'text-muted hover:text-content'
                    )}
                >
                    {o}
                </button>
            ))}
        </div>
    )
}
