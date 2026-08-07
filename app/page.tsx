import { HomeApp } from '@/components/apps/HomeApp'

/**
 * A server component, statically prerendered. The desktop shell is additive, so
 * this route is fully crawlable and readable with the shell off
 * (see /?experience=boring). Window content comes from the same component via
 * lib/apps.tsx, which is what keeps the two in sync.
 */
export default function Page() {
    return <HomeApp />
}
