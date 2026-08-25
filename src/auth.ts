import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import NeonAdapter from '@auth/neon-adapter'
import { Pool } from '@neondatabase/serverless'
import { isAuthConfigured } from '@/lib/db'

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  if (!isAuthConfigured()) {
    return {
      providers: [],
      secret: process.env.AUTH_SECRET,
    }
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL! })

  return {
    adapter: NeonAdapter(pool),
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    ],
    pages: {
      signIn: '/login',
    },
    trustHost: true,
    secret: process.env.AUTH_SECRET,
  }
})
