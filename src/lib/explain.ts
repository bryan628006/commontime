import { decisiveStep, type DecisiveStep, type RankResult, type Recommendation, type WindowScore } from './rank'
import { windowLabel } from './time'
import type { Poll } from './types'

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

export function listNames(names: string[]) {
  if (names.length <= 1) return names.join('')
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

export function unavailableNames(w: WindowScore) {
  return w.people.filter((p) => p.state === 0).map((p) => p.name)
}

/** "6/6 can attend · 4 prefer this time" */
export function summaryLine(w: WindowScore, total: number) {
  const pref =
    w.preferred === 0
      ? 'no one marked it Preferred'
      : `${w.preferred} ${plural(w.preferred, 'prefers', 'prefer')} this time`
  return { attend: `${w.attendance}/${total} can attend`, pref }
}

export interface LadderStep {
  id: Exclude<DecisiveStep, 'tied'>
  label: string
  mine: string
  theirs: string
  outcome: 'same' | 'decided' | 'unused'
}

/**
 * The three-step ladder for one option, compared against a neighbour
 * (#1 is compared with #2 below it; every other option with the one above it).
 */
export function ladder(me: WindowScore, other: WindowScore | undefined): { steps: LadderStep[]; decided: DecisiveStep } {
  const decided = other ? decisiveStep(me, other) : 'tied'
  const order: LadderStep['id'][] = ['attendance', 'preference', 'fairness']
  const reachedIndex = decided === 'tied' ? 2 : order.indexOf(decided)
  const fmt = {
    attendance: (w: WindowScore) => `${w.attendance}`,
    preference: (w: WindowScore) => `${w.prefScore} pts`,
    fairness: (w: WindowScore) => `${w.works} Works`,
  }
  const labels = { attendance: 'Attendance', preference: 'Preference', fairness: 'Fairness' }
  const outcomeAt = (i: number): LadderStep['outcome'] => {
    if (!other || i > reachedIndex) return 'unused'
    if (i < reachedIndex) return 'same'
    return decided === 'tied' ? 'same' : 'decided'
  }
  const steps = order.map((id, i) => ({
    id,
    label: labels[id],
    mine: fmt[id](me),
    theirs: other ? fmt[id](other) : '—',
    outcome: outcomeAt(i),
  }))
  return { steps, decided }
}

/** The one-line "why" under each recommendation card. */
export function reasonFor(poll: Poll, result: RankResult, index: number): { title: string; body: string } {
  const opt = result.options[index]
  const total = result.responded
  const missing = unavailableNames(opt)
  const everyone = opt.attendance === total

  if (opt.tied) {
    const twin = result.options.find((o) => o !== opt && o.rank === opt.rank)
    const twinLabel = twin ? windowLabel(poll, twin.day, twin.startSlot, poll.duration) : null
    return {
      title: 'Tied',
      body: twinLabel
        ? `Same attendance and preference as ${twinLabel.weekday} ${twinLabel.time}. We won't pick a winner for you.`
        : 'Other times score exactly the same. We won’t pick a winner for you.',
    }
  }

  if (index === 0) {
    if (everyone) {
      return {
        title: 'Why it’s on top',
        body:
          opt.preferred > 0
            ? 'Everyone can attend, and this option has the highest preference score.'
            : 'Everyone can attend, though no one marked it Preferred.',
      }
    }
    return {
      title: 'Best coverage',
      body: `No time works for all ${total}. This one has the most people; ${listNames(missing)} can’t make it.`,
    }
  }

  const above = result.options[index - 1]
  const step = decisiveStep(above, opt)
  const label = windowLabel(poll, above.day, above.startSlot, poll.duration)
  const ref = `#${above.rank} (${label.weekday} ${label.time})`
  if (step === 'attendance') {
    const who = missing.length ? ` ${listNames(missing)} can’t make it.` : ''
    return {
      title: 'Why it ranks lower',
      body: `Fewer people can attend than ${ref}: ${opt.attendance} vs ${above.attendance}.${who}`,
    }
  }
  if (step === 'preference') {
    return {
      title: 'Why it ranks lower',
      body: `${everyone ? 'Everyone can attend' : `Same attendance as ${ref}`}, but fewer people prefer this time (${opt.prefScore} vs ${above.prefScore} pts).`,
    }
  }
  return {
    title: 'Why it ranks lower',
    body: `Ties ${ref} on attendance and preference, but more people would only be settling for it.`,
  }
}

export function respondedLabel(result: RankResult) {
  if (result.invitedCount) return `Based on ${result.responded} of ${result.invitedCount} responses`
  return `Based on ${result.responded} ${plural(result.responded, 'response', 'responses')}`
}

/** The rank badge already shows the number, so the label never repeats it. */
export function optionHeadline(rec: Recommendation, result: RankResult) {
  if (rec.tied) return 'Tied'
  if (rec.rank === 1) {
    if (result.provisional) return 'Leading so far'
    return result.noFullCoverage ? 'Best coverage' : 'Best time'
  }
  return 'Alternative'
}
