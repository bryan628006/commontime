import { addDays, format, nextMonday, startOfDay } from 'date-fns'
import { cellKey } from './time'
import type { Cells, Poll, PollResponse } from './types'

export const SAMPLE_ID = 'capstone-sync'
export const SAMPLE_ADMIN = 'maya-7f3k'

const DAY_START = 9 * 60
const DAY_END = 21 * 60

type Mark = [day: number, from: number, to: number, pref: 1 | 2]

/** Hours are decimal (19.5 = 7:30 PM); `to` is exclusive. */
function paint(marks: Mark[], dayStart = DAY_START): Cells {
  const cells: Cells = {}
  for (const [day, from, to, pref] of marks) {
    for (let m = from * 60; m < to * 60; m += 30) {
      cells[cellKey(day, (m - dayStart) / 30)] = pref
    }
  }
  return cells
}

const W = 1
const P = 2

/**
 * Shaped so the demo tells the PRD story:
 *   #1 Tue 7 PM  — 5/5, 4 Preferred (Jordan only "Works")
 *   #2 Wed 6 PM  — 5/5, but only 2 Preferred  → ranks lower on preference
 *   #3 Thu 4 PM  — same preference score as #2, but Jordan can't come → ranks lower on attendance
 * Alex hasn't responded yet, so the organizer sees a pending nudge.
 */
const PEOPLE: { name: string; marks: Mark[]; minsAgo: number }[] = [
  {
    name: 'Maya',
    minsAgo: 300,
    marks: [
      [0, 10, 12, P], [0, 13, 17, W],
      [1, 13, 17, W], [1, 19, 21, P],
      [2, 10, 12, W], [2, 17, 19, W],
      [3, 15, 18, P],
      [4, 10, 14, W],
    ],
  },
  {
    name: 'Ethan',
    minsAgo: 220,
    marks: [
      [0, 18, 21, W],
      [1, 19, 20, P], [1, 20, 20.5, W],
      [2, 18, 21, P],
      [3, 16, 18, P],
      [4, 12, 17, W],
    ],
  },
  {
    name: 'Priya',
    minsAgo: 160,
    marks: [
      [0, 17, 19, W],
      [1, 18, 19, W], [1, 19, 21, P],
      [2, 17, 20, W],
      [3, 16, 18, P],
    ],
  },
  {
    name: 'Jordan',
    minsAgo: 95,
    marks: [
      [0, 12, 15, P],
      [1, 19, 21, W],
      [2, 18, 20, P],
      [4, 9, 12, P],
    ],
  },
  {
    name: 'Sam',
    minsAgo: 40,
    marks: [
      [0, 9, 12, W],
      [1, 19, 20.5, P],
      [2, 17, 21, W],
      [3, 15, 17, W],
      [4, 13, 15, P],
    ],
  },
]

export const SAMPLE_INVITEES = ['Maya', 'Ethan', 'Priya', 'Jordan', 'Sam', 'Alex']

export function sampleDates(now = new Date()) {
  const monday = nextMonday(startOfDay(now))
  return Array.from({ length: 5 }, (_, i) => format(addDays(monday, i), 'yyyy-MM-dd'))
}

export function buildSamplePoll(now = Date.now()): Poll {
  const responses: PollResponse[] = PEOPLE.map((p) => ({
    id: `r-${p.name.toLowerCase()}`,
    name: p.name,
    cells: paint(p.marks),
    updatedAt: now - p.minsAgo * 60_000,
  }))
  return {
    id: SAMPLE_ID,
    adminToken: SAMPLE_ADMIN,
    name: 'Capstone Team Sync',
    note: 'Final prototype review before Friday’s critique. Bring your Figma links.',
    organizerName: 'Maya',
    dates: sampleDates(new Date(now)),
    dayStartMin: DAY_START,
    dayEndMin: DAY_END,
    duration: 60,
    invitees: SAMPLE_INVITEES,
    responses,
    status: 'open',
    createdAt: now - 6 * 60 * 60_000,
    isSample: true,
  }
}

// ── the rest of the demo dashboard ──────────────────────────────────────────
//
// The dashboard is seen through one demo person — Maya — so each extra poll is
// shaped to land in a different state for her:
//   • HCI 330 Study Group  → Jordan organizes, Maya hasn't responded  ("Needs you")
//   • Friday Team Dinner   → Maya organizes, everyone's in            ("Needs you": decide)
//   • Capstone Team Sync   → Maya organizes, waiting on Alex          ("In progress")
//   • Design Club Board    → Priya organizes, already confirmed       ("Confirmed")

export const DEMO_ME = 'Maya'
export const SAMPLE_IDS = ['capstone-sync', 'hci-study-group', 'team-dinner', 'design-club-board']

type Person = { name: string; marks: Mark[]; minsAgo: number }

const toResponses = (people: Person[], now: number, dayStart: number): PollResponse[] =>
  people.map((p) => ({
    id: `r-${p.name.toLowerCase()}`,
    name: p.name,
    cells: paint(p.marks, dayStart),
    updatedAt: now - p.minsAgo * 60_000,
  }))

function datesFrom(now: number, offsets: number[]) {
  const monday = nextMonday(startOfDay(new Date(now)))
  return offsets.map((o) => format(addDays(monday, o), 'yyyy-MM-dd'))
}

function buildStudyGroup(now: number): Poll {
  const start = 14 * 60
  return {
    id: 'hci-study-group',
    adminToken: 'jordan-9x1c',
    name: 'HCI 330 Study Group',
    note: 'Midterm review — bring your questions on the usability-testing chapter.',
    organizerName: 'Jordan',
    dates: datesFrom(now, [1, 2, 3]),
    dayStartMin: start,
    dayEndMin: 20 * 60,
    duration: 90,
    invitees: ['Jordan', 'Maya', 'Priya', 'Sam', 'Alex'],
    responses: toResponses(
      [
        { name: 'Jordan', minsAgo: 900, marks: [[0, 15, 18, P], [1, 14, 17, W], [2, 17, 20, P]] },
        { name: 'Priya', minsAgo: 600, marks: [[0, 16, 19, P], [2, 17, 19, W]] },
        { name: 'Sam', minsAgo: 300, marks: [[0, 15, 18, W], [2, 16, 20, P]] },
        { name: 'Alex', minsAgo: 120, marks: [[0, 16, 18, P], [1, 15, 17, W], [2, 18, 20, W]] },
      ],
      now,
      start,
    ),
    status: 'open',
    createdAt: now - 20 * 60 * 60_000,
    isSample: true,
  }
}

function buildTeamDinner(now: number): Poll {
  const start = 17 * 60
  return {
    id: 'team-dinner',
    adminToken: 'maya-4d7r',
    name: 'Friday Team Dinner',
    note: 'Celebrating the end of the sprint. Somewhere near campus.',
    organizerName: 'Maya',
    dates: datesFrom(now, [4, 5, 6]),
    dayStartMin: start,
    dayEndMin: 22 * 60,
    duration: 120,
    responses: toResponses(
      [
        { name: 'Maya', minsAgo: 1500, marks: [[0, 18, 21, P], [1, 17, 21, W]] },
        { name: 'Ethan', minsAgo: 1300, marks: [[0, 18, 22, P], [1, 18, 20, P]] },
        { name: 'Priya', minsAgo: 800, marks: [[0, 17, 20, W], [1, 18, 21, P], [2, 17, 19, W]] },
        { name: 'Sam', minsAgo: 200, marks: [[0, 18, 20, P], [1, 19, 21, W]] },
      ],
      now,
      start,
    ),
    status: 'open',
    createdAt: now - 26 * 60 * 60_000,
    isSample: true,
  }
}

function buildDesignClub(now: number): Poll {
  const start = 12 * 60
  const responses = toResponses(
    [
      { name: 'Priya', minsAgo: 3000, marks: [[3, 16, 19, P], [1, 12, 14, W]] },
      { name: 'Maya', minsAgo: 2800, marks: [[3, 15, 18, P], [0, 12, 13, W]] },
      { name: 'Ethan', minsAgo: 2500, marks: [[3, 17, 19, W], [2, 13, 16, P]] },
      { name: 'Sam', minsAgo: 2300, marks: [[3, 16, 18, P]] },
    ],
    now,
    start,
  )
  return {
    id: 'design-club-board',
    adminToken: 'priya-2m8q',
    name: 'Design Club Board Meeting',
    note: 'Plan the spring portfolio review and the alumni panel.',
    organizerName: 'Priya',
    dates: datesFrom(now, [0, 1, 2, 3]),
    dayStartMin: start,
    dayEndMin: 19 * 60,
    duration: 60,
    invitees: ['Priya', 'Maya', 'Ethan', 'Sam'],
    responses,
    status: 'confirmed',
    // Thu 5:00 PM — everyone can make it
    confirmed: { day: 3, startSlot: (17 * 60 - start) / 30, at: now - 20 * 60 * 60_000, attendeesAtConfirm: responses.map((r) => r.id) },
    createdAt: now - 3 * 24 * 60 * 60_000,
    isSample: true,
  }
}

/** Every demo poll, in the order the dashboard should feel natural with. */
export function buildSamplePolls(now = Date.now()): Poll[] {
  return [buildSamplePoll(now), buildStudyGroup(now), buildTeamDinner(now), buildDesignClub(now)]
}
