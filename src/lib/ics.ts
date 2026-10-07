import { parseISO } from 'date-fns'
import { slotStartMin } from './time'
import type { Poll } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

function localStamp(d: Date) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
}

export function confirmedRange(poll: Poll) {
  if (!poll.confirmed) return null
  const start = parseISO(poll.dates[poll.confirmed.day])
  const startMin = slotStartMin(poll, poll.confirmed.startSlot)
  start.setHours(0, startMin, 0, 0)
  const end = new Date(start.getTime() + poll.duration * 60_000)
  return { start, end }
}

export function downloadIcs(poll: Poll, url: string) {
  const range = confirmedRange(poll)
  if (!range) return
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CommonTime//Demo//EN',
    'BEGIN:VEVENT',
    `UID:${poll.id}@commontime.demo`,
    `DTSTAMP:${localStamp(new Date())}`,
    `DTSTART:${localStamp(range.start)}`,
    `DTEND:${localStamp(range.end)}`,
    `SUMMARY:${poll.name}`,
    `DESCRIPTION:${(poll.note ? poll.note + '\\n\\n' : '') + 'Scheduled with CommonTime: ' + url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const blob = new Blob([body], { type: 'text/calendar' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${poll.name.replace(/[^\w-]+/g, '-').toLowerCase()}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export function googleCalendarUrl(poll: Poll, url: string) {
  const range = confirmedRange(poll)
  if (!range) return '#'
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: poll.name,
    dates: `${localStamp(range.start)}/${localStamp(range.end)}`,
    details: `${poll.note ? poll.note + '\n\n' : ''}Scheduled with CommonTime: ${url}`,
  })
  return `https://calendar.google.com/calendar/render?${params}`
}
