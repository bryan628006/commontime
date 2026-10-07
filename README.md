# CommonTime

**Find the best shared time, not just the overlapping one.**
A frontend-only concept prototype competing with When2meet. It was built for *AI-Augmented Designer*.

- **Live demo:** https://bryan628006.github.io/commontime/
- **Requirements:** the CommonTime PRD.
- **Visual system:** see [`DESIGN.md`](./DESIGN.md).

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # ranking engine tests (vitest)
npm run build    # type-check + production build → dist/
```

There's no backend. Polls live in `localStorage`. The app is seen through one demo person, **Maya**. The demo dock at the bottom of the screen switches roles on any poll. Use **Reset demo data** in that dock to start over.

## Demo script (≈3 min)

1. **Home → Open the demo dashboard.** **Meetings** groups Maya's four meetings:
   - **Needs you:** one poll is waiting on her availability; another is ready to decide.
   - **In progress:** a poll still collecting responses.
   - **Confirmed:** a meeting with a time already set.
2. **HCI 330 Study Group → paint availability.**
   - Drag across the grid (★ Preferred is the default brush).
   - Press **2** for ✓ Works and paint some more.
   - Try ⌘/Ctrl+Z, tapping a day header, or arrow keys + Space.
   - Then press **Submit**. Back on Meetings, it moves to *In progress*.
3. **Capstone Team Sync** (Maya organizes).
   - Hover the heatmap to see who can come. Hover an option card and its window lights up on the grid.
   - Open **Why this rank** on #2. Attendance ties, and preference decides.
4. **Choose #3** to see the attendance warning, then go back and confirm **#1**. The card morphs into the confirmed ticket.
5. **Demo dock → Ethan.** He sees the confirmed time first, with **Add to calendar**.
6. As Maya, **Reopen poll** to see the PRD's warning copy.
7. **New poll** to walk the full organizer setup and share flow. The new poll appears on Meetings as *Organizing*.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · Motion · Base UI · Zustand · NumberFlow · Sonner · date-fns · Lucide icons · DiceBear avatars

## Where things live

| Path | What |
| --- | --- |
| `src/lib/rank.ts` | Deterministic ranking: attendance → preference → fairness; weakest-state window rule; honest ties |
| `src/lib/explain.ts` | Plain-language reasons + the "Why this rank" ladder |
| `src/lib/seed.ts` | The sample poll, shaped so the ranking demonstrates each PRD rule |
| `src/components/grid/` | Availability painter + group heatmap |
| `src/components/results/` | Option cards, status strip, confirm dialog, ticket |
| `src/routes/` | Home, Create, Participant (`/e/:id`), Organizer (`/e/:id/admin/:token`) |

Deploys to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml` (tests → build with `BASE_PATH=/commontime/` → publish, with a `404.html` SPA fallback). `vercel.json` keeps the rewrite for root-domain hosts.
