'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * A staged progress dialog. Ported in concept from the archived OS-Template's
 * "Update OS" window, with three defects from that version fixed:
 *
 *  1. The original ran a `setInterval` that called `setStage` from inside a
 *     `setProgress` updater. State updaters must be pure; calling another setter
 *     inside one is a React anti-pattern that misbehaves under concurrent
 *     rendering. Stage advances in an effect here, driven by progress.
 *  2. It never cleared the interval on the terminal stage, so a completed
 *     dialog kept a timer running for the life of the page.
 *  3. It ignored `prefers-reduced-motion`. Fake progress theatre is exactly the
 *     kind of motion someone with vestibular sensitivity asked not to see, so it
 *     jumps straight to done.
 *
 * It is deliberately fake and says so. A progress bar that implies real work is
 * a lie in an interface, and this one is a demonstration of a non-prose window
 * archetype (fixed size, centred, no resize handles).
 */

const STAGES = ['checking', 'downloading', 'installing', 'complete'] as const
type Stage = (typeof STAGES)[number]

const LABEL: Record<Stage, string> = {
    checking: 'Checking for updates',
    downloading: 'Downloading components',
    installing: 'Installing',
    complete: 'Up to date',
}

const FILES = [
    'shell.core.js',
    'window-manager.js',
    'tokens.css',
    'container-queries.css',
    'motion.keyframes.css',
    'dock.js',
    'terminal.js',
]

export function SystemUpdateApp() {
    const reduced = useRef(false)
    const [stage, setStage] = useState<Stage>('checking')
    const [progress, setProgress] = useState(0)
    const [file, setFile] = useState('')

    useEffect(() => {
        reduced.current =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduced.current) {
            setStage('complete')
            setProgress(100)
        }
    }, [])

    // Advance progress. One interval, cleared on every stage change and on
    // unmount, and never running once complete.
    useEffect(() => {
        if (stage === 'complete') return
        const step = stage === 'checking' ? 4 : stage === 'downloading' ? 2 : 3
        const id = window.setInterval(() => {
            setProgress((p) => Math.min(100, p + step))
        }, 60)
        return () => window.clearInterval(id)
    }, [stage])

    // Stage transitions live here, not inside a setState updater.
    useEffect(() => {
        if (progress < 100 || stage === 'complete') return
        const i = STAGES.indexOf(stage)
        const next = STAGES[Math.min(i + 1, STAGES.length - 1)]
        setProgress(next === 'complete' ? 100 : 0)
        setStage(next)
    }, [progress, stage])

    useEffect(() => {
        if (stage !== 'downloading') return
        setFile(FILES[Math.floor((progress / 100) * (FILES.length - 1))] ?? '')
    }, [stage, progress])

    const done = stage === 'complete'

    return (
        <div className="flex h-full flex-col justify-center gap-4 text-[13px]">
            <div className="flex items-start gap-3">
                <div
                    data-scheme="secondary"
                    className={`grid size-9 shrink-0 place-items-center rounded-full border border-border ${
                        done ? '' : 'animate-float'
                    }`}
                >
                    {done ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                            <path
                                d="M3 8.5l3.5 3.5L13 5"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                fill="none"
                            />
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                            <path
                                d="M8 2v6l4 2"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                fill="none"
                            />
                            <circle
                                cx="8"
                                cy="8"
                                r="6"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                fill="none"
                            />
                        </svg>
                    )}
                </div>
                <div className="min-w-0">
                    <p className="font-semibold text-content">{LABEL[stage]}</p>
                    <p className="truncate text-muted">
                        {done
                            ? 'No updates available. This dialog is a demo.'
                            : stage === 'downloading' && file
                              ? file
                              : 'Please wait'}
                    </p>
                </div>
            </div>

            <div
                role="progressbar"
                aria-valuenow={done ? 100 : progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={LABEL[stage]}
                data-scheme="secondary"
                className="h-2 w-full overflow-hidden rounded-full border border-border"
            >
                <div
                    className="h-full rounded-full bg-accent transition-[width] duration-100 ease-linear"
                    style={{ width: `${done ? 100 : progress}%` }}
                />
            </div>

            <ol className="grid gap-1 text-[12px] text-muted">
                {STAGES.map((s, i) => {
                    const at = STAGES.indexOf(stage)
                    return (
                        <li key={s} className="flex items-center gap-2">
                            <span
                                className={
                                    i < at || done
                                        ? 'text-accent'
                                        : i === at
                                          ? 'text-content'
                                          : 'opacity-40'
                                }
                            >
                                {i < at || done ? '✓' : i === at ? '•' : '○'}
                            </span>
                            <span className={i === at && !done ? 'text-content' : undefined}>
                                {LABEL[s]}
                            </span>
                        </li>
                    )
                })}
            </ol>

            <p className="text-[11px] text-muted">
                Fixed size and centred, configured in <code className="font-mono">lib/appSettings.ts</code>.
                Resize handles are suppressed for this route.
            </p>
        </div>
    )
}
