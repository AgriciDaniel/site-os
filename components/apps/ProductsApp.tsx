import { Prose } from '@/components/os/Prose'

export function ProductsApp() {
    return (
        <Prose>
            <h1>Products</h1>
            <p>
                An <strong>Explorer</strong>-style page: a browsable list rather than a stack
                of marketing sections. The window archetype is chosen per route, so pages
                stay internally consistent and nobody invents a one-off layout.
            </p>
            <table>
                <thead><tr><th>Archetype</th><th>Metaphor</th><th>Good for</th></tr></thead>
                <tbody>
                    <tr><td>Reader</td><td>Up to three columns</td><td>Docs, long articles</td></tr>
                    <tr><td>Explorer</td><td>File browser</td><td>Indexes, catalogues</td></tr>
                    <tr><td>Editor</td><td>Document editor</td><td>Ordinary content pages</td></tr>
                    <tr><td>Inbox</td><td>Mail panes</td><td>Threads, questions</td></tr>
                    <tr><td>Presentation</td><td>Slide deck</td><td>Product tours</td></tr>
                    <tr><td>MediaPlayer</td><td>Video player</td><td>Demos</td></tr>
                    <tr><td>Wizard</td><td>Stepped flow</td><td>Onboarding, quizzes</td></tr>
                </tbody>
            </table>
            <h2>Why archetypes beat freeform</h2>
            <p>
                Requiring every page to pick one forces consistency at authoring time
                instead of policing it at review time. It also extends the OS conceit into
                content structure rather than leaving it as chrome around arbitrary pages.
            </p>
        </Prose>
    )
}
