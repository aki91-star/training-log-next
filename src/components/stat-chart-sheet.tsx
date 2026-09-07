'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  aggregateStatsByWeek,
  aggregateStatsByMonth,
  type Session,
  type StatMetric,
} from '@/lib/data'

export type StatPeriod = 'week' | 'month'

export interface StatChartConfig {
  metric: StatMetric
  period: StatPeriod
  title: string
  unit: string
  decimals?: number
}

function formatValue(value: number, unit: string, decimals = 0): string {
  const formatted = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value))
  if (unit === 'sets') return `${formatted} sets`
  if (unit === 't') return `${formatted} t`
  if (unit === 'km') return `${formatted} km`
  if (unit === '回') return `${formatted} 回`
  return `${formatted} ${unit}`
}

function CustomTooltip({
  active,
  payload,
  unit,
  decimals = 0,
}: {
  active?: boolean
  payload?: { value: number }[]
  unit: string
  decimals?: number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#2a2a2a] border border-white/10 rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="font-bold text-white">{formatValue(payload[0].value, unit, decimals)}</p>
    </div>
  )
}

export default function StatChartSheet({
  config,
  sessions,
  refDate,
  open,
  onOpenChange,
}: {
  config: StatChartConfig | null
  sessions: Session[]
  refDate: Date
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const data = useMemo(() => {
    if (!config) return []
    return config.period === 'week'
      ? aggregateStatsByWeek(sessions, refDate, config.metric)
      : aggregateStatsByMonth(sessions, refDate, config.metric)
  }, [config, sessions, refDate])

  const periodLabel = config?.period === 'week' ? '過去12週' : '過去6ヶ月'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-[#1a1a1a] border-white/10 rounded-t-2xl max-h-[70vh] overflow-y-auto px-0"
      >
        {config && (
          <>
            <SheetHeader className="px-4 pb-3 border-b border-white/10">
              <SheetTitle className="text-white text-left">{config.title}</SheetTitle>
              <p className="text-xs text-gray-500">{periodLabel}の推移</p>
            </SheetHeader>
            <div className="p-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                      tickFormatter={v =>
                        config.decimals ? Number(v).toFixed(config.decimals) : String(Math.round(Number(v)))
                      }
                    />
                    <Tooltip
                      content={
                        <CustomTooltip unit={config.unit} decimals={config.decimals} />
                      }
                      cursor={{ stroke: 'rgba(249,115,22,0.3)', strokeWidth: 1 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ fill: '#f97316', strokeWidth: 0, r: 3 }}
                      activeDot={{ fill: '#fb923c', strokeWidth: 0, r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {data.length > 0 && (
                <p className="text-center text-xs text-gray-500 mt-3">
                  最新: {formatValue(data[data.length - 1].value, config.unit, config.decimals)}
                </p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
