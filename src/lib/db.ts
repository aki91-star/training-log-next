import { neon } from '@neondatabase/serverless'

function getDatabaseUrl(): string | null {
  return (
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    null
  )
}

export function isDatabaseConfigured(): boolean {
  return getDatabaseUrl() !== null
}

export function getSql() {
  const url = getDatabaseUrl()
  if (!url) {
    throw new Error('DATABASE_URL is not configured')
  }
  return neon(url)
}

export function isAuthConfigured(): boolean {
  return (
    isDatabaseConfigured() &&
    Boolean(process.env.AUTH_SECRET) &&
    Boolean(process.env.GOOGLE_CLIENT_ID) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET)
  )
}
