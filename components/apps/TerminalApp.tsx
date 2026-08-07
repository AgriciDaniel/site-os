'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useShell } from '@/components/shell/ShellProvider'
import { apps } from '@/lib/apps'

/**
 * A working terminal, ported in concept from the archived OS-Template.
 *
 * Two changes from that version, both because this shell has real state:
 *
 *  - It reads and writes the SHELL, not a prop. The original threaded a single
 *    `onBackgroundChange` callback down from the desktop, so the terminal could
 *    only recolour the background. Here it reaches the same context every other
 *    component uses, so it can toggle mode and skin, cycle wallpaper, and open
 *    and close windows. A terminal that cannot drive the system is set dressing.
 *
 *  - Command output is data, not JSX pushed into history. The original stored
 *    React nodes in state, which makes history impossible to serialise, replay,
 *    or test. Commands here return strings or a small typed block.
 */

type Line = { kind: 'in' | 'out' | 'err'; text: string } | { kind: 'block'; node: ReactNode }

const BANNER = String.raw`
   ___  ___     _         _ _
  / _ \/ __|   | |__  ___| | |
 | (_) \__ \   | '_ \/ -_) | |
  \___/|___/   |_.__/\___|_|_|
`

export function TerminalApp() {
    const {
        mode,
        setMode,
        skin,
        setSkin,
        wallpaper,
        cycleWallpaper,
        openPath,
        closeAll,
        windows,
        reduceTransparency,
        setReduceTransparency,
    } = useShell()

    const [lines, setLines] = useState<Line[]>([
        { kind: 'out', text: 'shell 1.0.0. Type `help` for commands.' },
    ])
    const [input, setInput] = useState('')
    // Command history, navigable with the arrow keys. The original had none, and
    // a terminal without history recall is tedious within about four commands.
    const [history, setHistory] = useState<string[]>([])
    const [histIndex, setHistIndex] = useState(-1)

    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight
    }, [lines])

    const push = (...next: Line[]) => setLines((prev) => [...prev, ...next])

    const run = (raw: string) => {
        const cmd = raw.trim()
        push({ kind: 'in', text: `$ ${cmd}` })
        if (!cmd) return

        setHistory((h) => [cmd, ...h].slice(0, 50))
        setHistIndex(-1)

        const [verb, ...rest] = cmd.split(/\s+/)
        const arg = rest.join(' ').toLowerCase()

        switch (verb.toLowerCase()) {
            case 'help':
                return push({
                    kind: 'block',
                    node: (
                        <dl className="grid grid-cols-[10rem_1fr] gap-x-3 gap-y-0.5">
                            {[
                                ['help', 'this list'],
                                ['clear', 'clear the screen'],
                                ['fetch', 'system info'],
                                ['ls', 'list installed apps'],
                                ['open <path>', 'open an app in a window'],
                                ['close all', 'close every window'],
                                ['theme [light|dark]', 'set or toggle colour mode'],
                                ['skin [modern|classic]', 'set or toggle skin'],
                                ['wallpaper', 'cycle the wallpaper'],
                                ['transparency [on|off]', 'backdrop blur, the costly bit'],
                                ['windows', 'list open windows'],
                                ['echo <text>', 'print text'],
                            ].map(([c, d]) => (
                                <div key={c} className="col-span-2 grid grid-cols-subgrid">
                                    <dt className="text-emerald-400">{c}</dt>
                                    <dd className="text-zinc-400">{d}</dd>
                                </div>
                            ))}
                        </dl>
                    ),
                })

            case 'clear':
                return setLines([])

            case 'fetch':
            case 'neofetch':
                return push({
                    kind: 'block',
                    node: (
                        <div className="flex flex-wrap gap-6">
                            <pre className="text-[10px] leading-tight text-indigo-400">{BANNER}</pre>
                            <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-0.5">
                                {[
                                    ['shell', 'os-shell-site 1.0.0'],
                                    ['framework', 'Next.js App Router'],
                                    ['mode', mode],
                                    ['skin', skin],
                                    ['wallpaper', String(wallpaper)],
                                    ['blur', reduceTransparency ? 'off' : '28px'],
                                    ['apps', String(Object.keys(apps).length)],
                                    ['windows', String(windows.filter((w) => !w.closing).length)],
                                ].map(([k, v]) => (
                                    <div key={k} className="col-span-2 grid grid-cols-subgrid">
                                        <dt className="text-cyan-400">{k}</dt>
                                        <dd className="text-zinc-300">{v}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    ),
                })

            case 'ls':
                return push({ kind: 'out', text: Object.keys(apps).join('  ') })

            case 'windows': {
                const open = windows.filter((w) => !w.closing)
                if (!open.length) return push({ kind: 'out', text: 'no windows open' })
                return push(
                    ...open.map<Line>((w) => ({
                        kind: 'out',
                        text: `${w.title.padEnd(16)} ${w.path}${w.minimized ? '  (minimized)' : ''}`,
                    }))
                )
            }

            case 'open': {
                if (!arg) return push({ kind: 'err', text: 'usage: open <path>' })
                const path = arg.startsWith('/') ? arg : `/${arg}`
                if (!(path in apps))
                    return push({ kind: 'err', text: `no app at ${path}. try \`ls\`` })
                openPath(path, { intent: 'launch' })
                return push({ kind: 'out', text: `opening ${path}` })
            }

            case 'close':
                if (arg === 'all') {
                    closeAll()
                    return push({ kind: 'out', text: 'closed all windows' })
                }
                return push({ kind: 'err', text: 'usage: close all' })

            case 'theme': {
                const next = arg === 'light' || arg === 'dark' ? arg : mode === 'light' ? 'dark' : 'light'
                setMode(next)
                return push({ kind: 'out', text: `mode: ${next}` })
            }

            case 'skin': {
                const next =
                    arg === 'modern' || arg === 'classic' ? arg : skin === 'modern' ? 'classic' : 'modern'
                setSkin(next)
                return push({ kind: 'out', text: `skin: ${next}` })
            }

            case 'wallpaper':
                cycleWallpaper()
                return push({ kind: 'out', text: 'wallpaper cycled' })

            case 'transparency': {
                // `on` means transparency IS on, i.e. blur enabled.
                const next = arg === 'on' ? false : arg === 'off' ? true : !reduceTransparency
                setReduceTransparency(next)
                return push({
                    kind: 'out',
                    text: `transparency ${next ? 'off (opaque, no blur)' : 'on (frosted)'}`,
                })
            }

            case 'echo':
                return push({ kind: 'out', text: rest.join(' ') })

            default:
                return push({
                    kind: 'err',
                    text: `command not found: ${verb}. try \`help\``,
                })
        }
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // The shell's global single-key shortcuts are suppressed inside inputs,
        // so typing `.` or `\` here is safe. Arrow keys walk command history.
        if (e.key === 'Enter') {
            run(input)
            setInput('')
            return
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault()
            const i = Math.min(histIndex + 1, history.length - 1)
            if (i >= 0) {
                setHistIndex(i)
                setInput(history[i])
            }
            return
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            const i = histIndex - 1
            setHistIndex(i)
            setInput(i >= 0 ? history[i] : '')
        }
    }

    return (
        // Fixed dark surface on purpose: a terminal is one of the few places a
        // deliberately un-themed panel is correct, and it stays legible in both
        // colour modes.
        <div
            ref={scrollRef}
            onClick={() => inputRef.current?.focus()}
            className="h-full min-h-[18rem] overflow-auto rounded bg-zinc-950 p-3 font-mono text-[12px] leading-relaxed text-zinc-300"
        >
            {lines.map((l, i) =>
                l.kind === 'block' ? (
                    <div key={i} className="my-2">
                        {l.node}
                    </div>
                ) : (
                    <div
                        key={i}
                        className={
                            l.kind === 'in'
                                ? 'text-zinc-100'
                                : l.kind === 'err'
                                  ? 'text-rose-400'
                                  : 'text-zinc-400'
                        }
                    >
                        <span className="whitespace-pre-wrap">{l.text}</span>
                    </div>
                )
            )}

            <div className="flex items-center gap-2">
                <span className="text-emerald-400">$</span>
                <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    spellCheck={false}
                    autoComplete="off"
                    aria-label="Terminal input"
                    className="flex-1 bg-transparent text-zinc-100 outline-none"
                />
            </div>
        </div>
    )
}
