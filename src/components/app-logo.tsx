import Image from 'next/image'
import { APP_SHORT_NAME } from '@/lib/app-config'
import { cn } from '@/lib/utils'

const iconSizes = {
  sm: 28,
  md: 36,
  lg: 64,
} as const

type AppLogoProps = {
  size?: keyof typeof iconSizes
  showName?: boolean
  showTagline?: boolean
  title?: string
  tagline?: string
  className?: string
}

export default function AppLogo({
  size = 'md',
  showName = true,
  showTagline = false,
  title = APP_SHORT_NAME,
  tagline,
  className,
}: AppLogoProps) {
  const px = iconSizes[size]

  return (
    <div className={cn('flex items-center gap-2.5 min-w-0', className)}>
      <Image
        src="/icon-192.png"
        alt={APP_SHORT_NAME}
        width={px}
        height={px}
        className="rounded-[22%] shrink-0"
        priority
      />
      {(showName || showTagline) && (
        <div className="min-w-0">
          {showName && (
            <p className="font-bold tracking-[0.12em] lg:tracking-tight leading-tight">{title}</p>
          )}
          {showTagline && tagline && (
            <p className="text-[11px] lg:text-xs text-gray-500 mt-0.5 truncate">{tagline}</p>
          )}
        </div>
      )}
    </div>
  )
}
