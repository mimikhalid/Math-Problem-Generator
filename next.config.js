/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a second dev server (e.g. a preview) build into its own folder instead of sharing .next
  distDir: process.env.NEXT_DIST_DIR || '.next',
}

module.exports = nextConfig
