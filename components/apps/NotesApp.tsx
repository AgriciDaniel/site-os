import { Prose } from '@/components/os/Prose'

export function NotesApp() {
    return (
        <Prose>
            <h1>Adaptation notes</h1>
            <p>
                This shell borrows a strategy, not a brand: keep one stable route window,
                let content respond to that window, and reserve the complete desktop
                manager for visitors who explicitly choose it.
            </p>

            <h2>Responsive behavior</h2>
            <ul>
                <li>
                    <strong>Desktop:</strong> one centered reading window, taskbar, and
                    icon columns. Free-window mode is available through the homepage.
                </li>
                <li>
                    <strong>Tablet:</strong> the taskbar disappears, the centered window
                    keeps a generous inset, and content reflows inside it.
                </li>
                <li>
                    <strong>Phone:</strong> the route window fills the shell. Closing it
                    reveals a three-column app launcher.
                </li>
            </ul>

            <h2>Marketing behavior</h2>
            <ul>
                <li>State the visitor outcome before explaining the mechanism.</li>
                <li>Put a working demonstration or number next to the claim it proves.</li>
                <li>Use one obvious primary action and one quieter exploratory action.</li>
                <li>Sequence the page from promise to proof to depth to final invitation.</li>
                <li>Use a human voice, including a little humor, without obscuring the offer.</li>
            </ul>

            <h2>Color behavior</h2>
            <p>
                Reading surfaces stay neutral and translucent. The wallpaper carries
                atmosphere; signal blue marks active ideas, gold marks the primary call to
                action, and mint or coral distinguish supporting concepts. Color is a
                hierarchy tool, not background filler.
            </p>

            <h2>Implementation references</h2>
            <p>
                The full reusable study lives in{' '}
                <code>docs/site-os-design-playbook.md</code>. Shell mode is owned by{' '}
                <code>components/shell/ShellProvider.tsx</code>, responsive geometry by{' '}
                <code>app/globals.css</code>, and container-aware page composition by the
                app components.
            </p>
        </Prose>
    )
}
