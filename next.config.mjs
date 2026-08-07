import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Keep Turbopack scoped to this template even when a parent directory also
    // happens to contain a lockfile.
    turbopack: {
        root: projectRoot,
    },
}
export default nextConfig
