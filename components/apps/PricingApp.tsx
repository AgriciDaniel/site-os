import { Prose } from '@/components/os/Prose'

export function PricingApp() {
    return (
        <Prose>
            <h1>Pricing</h1>
            <p>
                Placeholder content. What matters here is that this window opens at its own
                configured size, set in <code>lib/appSettings.ts</code> rather than on the
                page itself, so window behaviour is reviewable in one table.
            </p>
            <table>
                <thead><tr><th>Setting</th><th>Effect</th></tr></thead>
                <tbody>
                    <tr><td><code>size.default</code></td><td>Opening dimensions</td></tr>
                    <tr><td><code>size.min</code> / <code>max</code></td><td>Resize limits</td></tr>
                    <tr><td><code>size.fixed</code></td><td>Disables resizing entirely</td></tr>
                    <tr><td><code>position.getPositionDefaults</code></td><td>Custom placement</td></tr>
                </tbody>
            </table>
            <p>
                A route absent from that table inherits the defaults, which is the correct
                bias: new pages should not need configuration to behave sensibly.
            </p>
        </Prose>
    )
}
