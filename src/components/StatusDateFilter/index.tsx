import { useMemo, useState } from 'react'
import { Text, View } from '@tarojs/components'
import './index.scss'

export interface StatusOption {
  value: string
  label: string
}

interface Props {
  statusValue: string
  statusOptions: StatusOption[]
  onStatusChange: (value: string) => void
  startDate: string
  endDate: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
  onConfirmDate: () => void
  dateTitle?: string
}

type OpenKey = '' | 'status' | 'date'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toYmd(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`
}

const WEEK = ['日', '一', '二', '三', '四', '五', '六']

function CalendarRange({
  start,
  end,
  onPick,
}: {
  start: string
  end: string
  onPick: (start: string, end: string) => void
}) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const cells = useMemo(() => {
    const days = new Date(year, month, 0).getDate()
    const first = new Date(year, month - 1, 1).getDay()
    const list: Array<number | null> = []
    for (let i = 0; i < first; i += 1) list.push(null)
    for (let d = 1; d <= days; d += 1) list.push(d)
    while (list.length % 7 !== 0) list.push(null)
    return list
  }, [month, year])

  const prevMonth = () => {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
      return
    }
    setMonth(month - 1)
  }

  const nextMonth = () => {
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
      return
    }
    setMonth(month + 1)
  }

  const onDay = (day: number) => {
    const ymd = toYmd(year, month, day)
    if (!start || (start && end)) {
      onPick(ymd, '')
      return
    }
    if (ymd < start) {
      onPick(ymd, '')
      return
    }
    onPick(start, ymd)
  }

  return (
    <View className='cal'>
      <View className='cal__head'>
        <Text className='cal__nav' onClick={prevMonth}>
          ‹
        </Text>
        <Text className='cal__title'>
          {year}年{month}月
        </Text>
        <Text className='cal__nav' onClick={nextMonth}>
          ›
        </Text>
      </View>
      <View className='cal__week'>
        {WEEK.map((w) => (
          <Text className='cal__week-item' key={w}>
            {w}
          </Text>
        ))}
      </View>
      <View className='cal__grid'>
        {cells.map((day, index) => {
          if (day == null) {
            return <View className='cal__cell' key={`e-${index}`} />
          }
          const ymd = toYmd(year, month, day)
          const isStart = ymd === start
          const isEnd = !!end && ymd === end
          const inMid = !!start && !!end && ymd > start && ymd < end
          const cls = [
            'cal__cell',
            isStart || isEnd ? 'cal__cell--edge' : '',
            inMid ? 'cal__cell--mid' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <View className={cls} key={ymd} onClick={() => onDay(day)}>
              <Text className='cal__day'>{day}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

export default function StatusDateFilter({
  statusValue,
  statusOptions,
  onStatusChange,
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onConfirmDate,
  dateTitle = '订单创建时间',
}: Props) {
  const [open, setOpen] = useState<OpenKey>('')
  const statusLabel =
    statusOptions.find((item) => item.value === statusValue)?.label || '状态'

  const toggle = (key: OpenKey) => {
    setOpen((prev) => (prev === key ? '' : key))
  }

  return (
    <View className='list-filter'>
      <View className='list-filter__nav'>
        <View
          className={
            open === 'status'
              ? 'list-filter__tab list-filter__tab--active'
              : 'list-filter__tab'
          }
          onClick={() => toggle('status')}
        >
          <Text className='list-filter__tab-text'>
            {statusValue === '-1' ? '状态' : statusLabel}
          </Text>
          <View
            className={
              open === 'status'
                ? 'list-filter__arrow list-filter__arrow--up'
                : 'list-filter__arrow'
            }
          />
        </View>
        <View
          className={
            open === 'date'
              ? 'list-filter__tab list-filter__tab--active'
              : 'list-filter__tab'
          }
          onClick={() => toggle('date')}
        >
          <Text className='list-filter__tab-text'>{dateTitle}</Text>
          <View
            className={
              open === 'date'
                ? 'list-filter__arrow list-filter__arrow--up'
                : 'list-filter__arrow'
            }
          />
        </View>
      </View>

      {open ? (
        <View className='list-filter__mask' onClick={() => setOpen('')} />
      ) : null}

      {open === 'status' ? (
        <View className='list-filter__panel list-filter__panel--status'>
          {statusOptions.map((item) => {
            const active = item.value === statusValue
            return (
              <View
                key={item.value}
                className='list-filter__radio'
                onClick={() => {
                  onStatusChange(item.value)
                  setOpen('')
                }}
              >
                <View
                  className={
                    active
                      ? 'list-filter__dot list-filter__dot--on'
                      : 'list-filter__dot'
                  }
                >
                  {active ? <View className='list-filter__dot-inner' /> : null}
                </View>
                <Text className='list-filter__radio-text'>{item.label}</Text>
              </View>
            )
          })}
        </View>
      ) : null}

      {open === 'date' ? (
        <View className='list-filter__panel list-filter__panel--date'>
          <CalendarRange
            start={startDate}
            end={endDate}
            onPick={(nextStart, nextEnd) => {
              onStartChange(nextStart)
              onEndChange(nextEnd)
            }}
          />
          <View
            className='list-filter__ok'
            onClick={() => {
              onConfirmDate()
              setOpen('')
            }}
          >
            <Text className='list-filter__ok-text'>确定</Text>
          </View>
        </View>
      ) : null}
    </View>
  )
}
