import clsx from 'clsx'

/**
 * Content styling for page bodies.
 *
 * Sizing uses CONTAINER query breakpoints (`@md`, `@lg`), never viewport
 * breakpoints. Every window is independently resizable, so viewport width tells
 * a component nothing about the space it actually has. This is the single most
 * important layout rule in the whole system: a media query here would size text
 * against the screen while the window it lives in is 400px wide.
 *
 * See ../study/os-shell-architecture.md section 8.
 */
export function Prose({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div
            className={clsx(
                '@container mx-auto max-w-[68ch] text-[14px] leading-relaxed text-content',
                // Type scale steps up with the WINDOW, not the viewport.
                '[&_h1]:mb-3 [&_h1]:text-[22px] [&_h1]:font-bold [&_h1]:tracking-tight',
                '@md:[&_h1]:text-[26px] @lg:[&_h1]:text-[30px]',
                '[&_h2]:mb-2 [&_h2]:mt-7 [&_h2]:text-[16px] [&_h2]:font-semibold',
                '@md:[&_h2]:text-[18px]',
                '[&_h3]:mb-1.5 [&_h3]:mt-5 [&_h3]:text-[14px] [&_h3]:font-semibold',
                '[&_p]:mb-3',
                '[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5',
                '[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5',
                '[&_a]:font-semibold [&_a]:text-accent [&_a]:underline [&_a]:decoration-accent/40 [&_a:hover]:decoration-accent',
                '[&_code]:rounded [&_code]:border [&_code]:border-border [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px]',
                '[&_kbd]:rounded [&_kbd]:border [&_kbd]:border-border [&_kbd]:px-1.5 [&_kbd]:py-0.5 [&_kbd]:font-mono [&_kbd]:text-[11px]',
                '[&_strong]:font-semibold',
                // Tables must scroll inside their own container, never widen the window.
                '[&_table]:mb-4 [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:text-[13px]',
                '[&_th]:border-b [&_th]:border-border [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold',
                '[&_td]:border-b [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5 [&_td]:align-top',
                '[&_blockquote]:mb-3 [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-3 [&_blockquote]:text-muted',
                className
            )}
        >
            {children}
        </div>
    )
}
