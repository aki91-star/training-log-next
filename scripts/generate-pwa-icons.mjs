import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')
const sourcePath = path.join(publicDir, 'icon-source.png')
const background = '#111111'

async function createSquareIcon(size, outputName, scale = 1) {
  const inner = Math.round(size * scale)
  const padding = Math.round((size - inner) / 2)

  const resized = await sharp(sourcePath)
    .resize(inner, inner, { fit: 'contain', background })
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: resized, top: padding, left: padding }])
    .png()
    .toFile(path.join(publicDir, outputName))
}

async function main() {
  await mkdir(publicDir, { recursive: true })

  await createSquareIcon(192, 'icon-192.png')
  await createSquareIcon(512, 'icon-512.png')
  await createSquareIcon(180, 'apple-touch-icon.png')
  await createSquareIcon(512, 'icon-maskable-512.png', 0.72)
  await createSquareIcon(32, 'favicon.png', 0.92)

  console.log('PWA icons generated from public/icon-source.png')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
