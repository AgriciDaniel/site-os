import { Prose } from '@/components/os/Prose'

export function AboutApp() {
    return (
        <Prose>
            <h1>About this scaffold</h1>
            <p>
                An original implementation of the desktop-OS website pattern. It uses an
                additive shell over static routes, intent-based window resolution, exact
                geometry restore, container-query layout, and a mode-times-scheme token
                system.
            </p>
            <h2>Make it your own</h2>
            <p>
                Every colour, gradient, illustration, and word here is original placeholder
                material meant to be replaced with your own brand and product content.
            </p>
            <h2>Token system</h2>
            <p>
                Colours resolve through two multiplying axes: a <code>light</code> or{' '}
                <code>dark</code> class on <code>&lt;html&gt;</code>, and a{' '}
                <code>data-scheme</code> of <code>primary</code>, <code>secondary</code>, or{' '}
                <code>tertiary</code> on any element. Their intersection sets{' '}
                <code>--bg</code> and <code>--border</code> as RGB triples, which Tailwind
                consumes with an alpha placeholder. So <code>bg-primary/75</code> works, and
                writing <code>dark:</code> variants is unnecessary.
            </p>
        </Prose>
    )
}
