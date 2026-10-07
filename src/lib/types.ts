/** 0 = unavailable / no response, 1 = works, 2 = preferred */
export type Pref = 0 | 1 | 2

/** `${dayIndex}:${slotIndex}` — slots are 30 minutes wide */
export type CellKey = `${number}:${number}`

export type Cells = Partial<Record<CellKey, 1 | 2>>

export type Duration = 30 | 60 | 90 | 120

export interface PollResponse {
  id: string
  name: string
  cells: Cells
  updatedAt: number
}

export interface Confirmation {
  day: number
  startSlot: number
  at: number
  /** response ids that could attend at the moment of confirmation */
  attendeesAtConfirm: string[]
}

export interface Poll {
  id: string
  adminToken: string
  name: string
  note?: string
  organizerName: string
  /** ISO dates (yyyy-MM-dd), sorted, max 14 */
  dates: string[]
  dayStartMin: number
  dayEndMin: number
  duration: Duration
  /** optional invite list (display names) */
  invitees?: string[]
  responses: PollResponse[]
  status: 'open' | 'confirmed'
  confirmed?: Confirmation
  /** organizer chose to see recommendations before everyone responded */
  proceedEarly?: boolean
  createdAt: number
  isSample?: boolean
  /** created in this browser — so "you" are its organizer on the dashboard */
  createdHere?: boolean
}
