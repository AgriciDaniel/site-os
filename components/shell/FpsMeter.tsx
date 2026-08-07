'use client'

import { useEffect, useRef, useState } from 'react'
import { useShell } from './ShellProvider'

/**
 * A frame-pacing meter, toggled with `f` or from Display options.
 *
 * WHY THIS EXISTS
 *
 * Drag smoothness could not be measured from the development environment: a
 * headless browser there composites in software and reports a flat 60fps no
 * matter what, so it can neither reproduce nor disprove stutter on real
 * hardware. Backdrop blur, GPU rasterisation and compositor behaviour are all
 * driver-dependent, which makes the only trustworthy measurement the one taken
 * on the machine that feels slow.
 *
 * So this reports what the browser actually did:
 *
 *   fps      frames in the last second
 *   p95      95th percentile frame time, which is where stutter shows up. A
 *            healthy 60fps display is 16.7ms. Anything above ~25ms is a dropped
 *            frame someone can see.
 *   dropped  frames over 25ms in the last second
 *
 * Averages hide stutter, which is why the percentile and the dropped count are
 * here: 58fps average with six 40ms frames feels broken, and an average alone
 * would call that fine.
 */
export function FpsMeter() {
    const { showFps, reduceTransparency } = useShell()
    const [stats, setStats] = useState({ fps: 0, p95: 0, dropped: 0, worst: 0 })
    const frames = useRef<number[]>([])
    const raf = useRef<number | null>(null)

    useEffect(() => {
        if (!showFps) return
        let last = performance.now()
        let lastReport = last

        const tick = (now: number) => {
            frames.current.push(now - last)
            last = now

            // Report once per second rather than per frame: a meter that
            // re-renders every frame is itself a source of jank.
            if (now - lastReport >= 1000) {
                const f = frames.current
                const sorted = [...f].sort((a, b) => a - b)
                setStats({
                    fps: f.length,
                    p95: +(sorted[Math.floor(sorted.length * 0.95)] ?? 0).toFixed(1),
                    dropped: f.filter((x) => x > 25).length,
                    worst: +(sorted[sorted.length - 1] ?? 0).toFixed(1),
                })
                frames.current = []
                lastReport = now
            }
            raf.current = requestAnimationFrame(tick)
        }

        raf.current = requestAnimationFrame(tick)
        return () => {
            if (raf.current !== null) cancelAnimationFrame(raf.current)
            frames.current = []
        }
    }, [showFps])

    if (!showFps) return null

    const bad = stats.dropped > 2 || stats.p95 > 25

    return (
        <div
            // Fixed and opaque on purpose. A translucent meter would blur its own
            // backdrop and add exactly the cost it is trying to measure.
            className="pointer-events-none fixed bottom-14 right-3 z-[120] rounded-md border border-black/20 bg-zinc-950/95 px-2.5 py-1.5 font-mono text-[11px] leading-tight text-zinc-200 shadow-2xl"
            aria-live="off"
        >
            <div className={bad ? 'text-rose-400' : 'text-emerald-400'}>
                {stats.fps} fps
                {bad ? '  STUTTER' : '  smooth'}
            </div>
            <div className="text-zinc-400">
                p95 {stats.p95}ms · worst {stats.worst}ms
            </div>
            <div className="text-zinc-400">
                dropped {stats.dropped}/s · blur {reduceTransparency ? 'off' : '28px'}
            </div>
        </div>
    )
}
