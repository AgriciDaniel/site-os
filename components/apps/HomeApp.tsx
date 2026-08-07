'use client'

import Link from 'next/link'
import { useState } from 'react'
import clsx from 'clsx'

const PROOF = [
    {
        value: '1',
        label: 'route window',
        note: 'Navigation replaces the current surface instead of piling up chrome.',
        color: 'border-signal-blue',
    },
    {
        value: '3',
        label: 'responsive modes',
        note: 'Desktop, tablet, and phone keep the metaphor without forcing drag.',
        color: 'border-signal-mint',
    },
    {
        value: '0',
        label: 'routes sacrificed',
        note: 'Every page remains a real, crawlable document below the shell.',
        color: 'border-signal-gold',
    },
]

const SHOWCASE = [
    {
        id: 'locked',
        label: 'Locked by default',
        eyebrow: 'Less window management, more website',
        title: 'The frame stays put. The story moves.',
        body: 'A visitor can browse the OS like a site: every icon and menu changes the route inside one stable window. There is no accidental drag, overlap, or hidden content.',
        accent: 'bg-signal-blue',
    },
    {
        id: 'responsive',
        label: 'Responsive inside',
        eyebrow: 'Container-aware composition',
        title: 'One page, shaped for its actual window.',
        body: 'Headlines, cards, and calls to action react to the reading surface—not blindly to the browser. That keeps the layout coherent in a tablet window or a full phone surface.',
        accent: 'bg-signal-mint',
    },
    {
        id: 'optional',
        label: 'Free when invited',
        eyebrow: 'A playground, not a prerequisite',
        title: 'The full desktop is still one link away.',
        body: 'Desktop visitors can opt into draggable, resizable, snapping windows. The advanced mode becomes a delightful extra instead of a usability tax.',
        accent: 'bg-signal-coral',
    },
]

export function HomeApp() {
    const [activeId, setActiveId] = useState(SHOWCASE[0].id)
    const active = SHOWCASE.find((item) => item.id === activeId) ?? SHOWCASE[0]

    return (
        <div className="@container mx-auto max-w-5xl pb-8 text-content">
            <section className="grid items-start gap-6 py-2 @xl:grid-cols-[minmax(0,1fr)_18rem] @xl:gap-10 @2xl:grid-cols-[minmax(0,1fr)_21rem]">
                <div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-primary/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                        <span className="grid grid-cols-2 gap-0.5" aria-hidden>
                            <span className="size-1.5 rounded-sm bg-signal-blue" />
                            <span className="size-1.5 rounded-sm bg-signal-gold" />
                            <span className="size-1.5 rounded-sm bg-signal-mint" />
                            <span className="size-1.5 rounded-sm bg-signal-coral" />
                        </span>
                        Site OS, made usable
                    </div>

                    <h1 className="max-w-[15ch] text-[clamp(2rem,8cqw,4.7rem)] font-black leading-[0.96] tracking-[-0.055em]">
                        A website visitors can{' '}
                        <span className="rounded-lg bg-signal-blue/10 px-1 text-signal-blue">
                            explore
                        </span>
                        , not wrestle.
                    </h1>
                    <p className="mt-5 max-w-[60ch] text-[15px] leading-relaxed text-muted @md:text-[17px]">
                        Keep the playful desktop metaphor. Remove the window-management
                        chores. The result feels distinctive on a large monitor and still
                        works naturally on a tablet or phone.
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-medium text-muted">
                        <span>✓ One stable reading surface</span>
                        <span>✓ Real routes underneath</span>
                        <span>✓ Free mode when requested</span>
                    </div>
                </div>

                <aside
                    data-scheme="secondary"
                    className="marketing-grid overflow-hidden rounded-2xl border border-border bg-primary/80 p-4 shadow-lg @md:p-5"
                >
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-signal-coral">
                        Pick your path
                    </p>
                    <p className="mt-2 text-[20px] font-bold leading-tight">
                        Start with the useful part.
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted">
                        Browse the system, inspect the implementation, or switch on the
                        full window manager.
                    </p>
                    <div className="mt-4 grid gap-2 @sm:grid-cols-2 @xl:grid-cols-1">
                        <Link
                            href="/products"
                            className="rounded-lg border border-signal-gold/80 bg-signal-gold px-4 py-2.5 text-center text-[13px] font-bold text-[#20180a] shadow-sm transition-transform hover:-translate-y-0.5"
                        >
                            Explore the system
                        </Link>
                        <a
                            href="/?experience=os&windows=free"
                            className="rounded-lg border border-border bg-primary/85 px-4 py-2.5 text-center text-[13px] font-semibold text-content hover:border-accent"
                        >
                            Try free-window mode
                        </a>
                    </div>
                    <p className="mt-3 text-center text-[11px] text-muted">
                        No signup. It is a template, not a funnel trap.
                    </p>
                </aside>
            </section>

            <section
                aria-label="Implementation proof"
                className="mt-7 grid gap-3 border-y border-border py-5 @md:grid-cols-3"
            >
                {PROOF.map((item) => (
                    <article
                        key={item.label}
                        className={clsx('border-l-4 pl-3', item.color)}
                    >
                        <p className="text-[26px] font-black leading-none">{item.value}</p>
                        <p className="mt-1 text-[12px] font-bold uppercase tracking-wide">
                            {item.label}
                        </p>
                        <p className="mt-1 text-[12px] leading-relaxed text-muted">
                            {item.note}
                        </p>
                    </article>
                ))}
            </section>

            <section className="mt-8">
                <div className="max-w-2xl">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-signal-mint">
                        Product proof before the long pitch
                    </p>
                    <h2 className="mt-2 text-[24px] font-black tracking-tight @md:text-[30px]">
                        The responsive model, in three clicks
                    </h2>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted">
                        Each decision answers a real usability problem while preserving the
                        character that makes an OS-style site memorable.
                    </p>
                </div>

                <div
                    role="tablist"
                    aria-label="Responsive model"
                    className="mt-5 flex gap-1 overflow-x-auto rounded-xl border border-border bg-primary/60 p-1"
                >
                    {SHOWCASE.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            role="tab"
                            aria-selected={active.id === item.id}
                            aria-controls="responsive-showcase-panel"
                            onClick={() => setActiveId(item.id)}
                            className={clsx(
                                'min-w-max flex-1 rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors',
                                active.id === item.id
                                    ? 'bg-content text-primary shadow-sm'
                                    : 'text-muted hover:bg-primary hover:text-content'
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <article
                    id="responsive-showcase-panel"
                    role="tabpanel"
                    className="mt-3 grid overflow-hidden rounded-2xl border border-border bg-primary/70 @lg:grid-cols-[0.9fr_1.1fr]"
                >
                    <div className={clsx('min-h-36 p-5 text-white @md:p-7', active.accent)}>
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] opacity-80">
                            {active.eyebrow}
                        </p>
                        <div
                            aria-hidden
                            className="mt-7 flex items-end gap-2 opacity-90"
                        >
                            <span className="h-12 w-16 rounded-lg border-2 border-white/80" />
                            <span className="h-20 w-24 rounded-xl border-2 border-white/90" />
                            <span className="h-14 w-10 rounded-lg border-2 border-white/80" />
                        </div>
                    </div>
                    <div className="p-5 @md:p-7">
                        <h3 className="text-[20px] font-black tracking-tight @md:text-[24px]">
                            {active.title}
                        </h3>
                        <p className="mt-3 text-[14px] leading-relaxed text-muted">
                            {active.body}
                        </p>
                        <Link
                            href="/notes"
                            className="mt-5 inline-flex items-center gap-2 text-[13px] font-bold text-accent hover:underline"
                        >
                            Read the adaptation notes <span aria-hidden>→</span>
                        </Link>
                    </div>
                </article>
            </section>

            <section className="mt-9 grid gap-4 @lg:grid-cols-2">
                <article className="rounded-2xl border border-border bg-primary/55 p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-signal-gold">
                        Marketing rule
                    </p>
                    <h2 className="mt-2 text-[20px] font-black">Claims travel with receipts.</h2>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted">
                        A direct promise is followed by a working interaction, a concrete
                        number, or an implementation detail. Proof sits beside the claim
                        instead of waiting three screens below it.
                    </p>
                </article>
                <article className="rounded-2xl border border-border bg-primary/55 p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-signal-coral">
                        Color rule
                    </p>
                    <h2 className="mt-2 text-[20px] font-black">Neutral where you read. Loud where you act.</h2>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted">
                        The wallpaper carries atmosphere. The window stays calm. Blue,
                        gold, mint, and coral mark meaning—never every available surface.
                    </p>
                </article>
            </section>

            <footer className="mt-9 rounded-2xl border border-accent/35 bg-accent/10 p-5 text-center @md:p-7">
                <p className="text-[22px] font-black tracking-tight @md:text-[28px]">
                    Keep the charm. Remove the friction.
                </p>
                <p className="mx-auto mt-2 max-w-xl text-[13px] leading-relaxed text-muted">
                    Close this window to see the launcher, or open Products to continue
                    through the site. On desktop, free-window mode remains available for
                    anyone who wants the full toy box.
                </p>
            </footer>
        </div>
    )
}
