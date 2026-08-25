#!/usr/bin/env node
/**
 * Neon にスキーマを適用するセットアップスクリプト
 * 使い方: node scripts/setup-db.mjs
 * 前提: .env.local に DATABASE_URL が設定されていること
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from '@neondatabase/serverless'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnv() {
  try {
    const raw = readFileSync(resolve(root, '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // .env.local が無くても DATABASE_URL が環境変数にあれば OK
  }
}

loadEnv()

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
if (!url) {
  console.error('DATABASE_URL が未設定です。.env.local を確認してください。')
  process.exit(1)
}

const schemaPath = resolve(root, 'src/lib/db/schema.sql')
const schema = readFileSync(schemaPath, 'utf8')
const pool = new Pool({ connectionString: url })

const statements = schema
  .split(';')
  .map(s => s.trim())
  .filter(Boolean)

console.log(`Applying ${statements.length} SQL statements to Neon...`)

try {
  for (const statement of statements) {
    await pool.query(statement)
    console.log('  ✓', statement.split('\n')[0].slice(0, 60))
  }
  console.log('\nDone. Tables: users, accounts, sessions, verification_token, user_workout_data')
} finally {
  await pool.end()
}
