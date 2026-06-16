export type BeatPlan = {
  /** Slots that were superseded and can no longer run, in chronological order. */
  missed: Date[];
  /** The slot to execute now, if the beat woke close enough to it. */
  run?: Date;
  /** The slot the next heartbeat should be armed for. */
  next: Date;
};

/**
 * Decides what a heartbeat should do when it wakes.
 *
 * A heartbeat is armed to fire at `expected`, but long `setTimeout` delays are
 * imprecise (OS sleep, GC, throttling, clock drift), so the callback can land
 * late. Given the slot we armed for, the instant the beat actually woke and the
 * configured tolerance, this returns which slots are missed, which slot (if
 * any) to run, and the slot to arm next.
 *
 * The effective tolerance is always bounded by the gap to the following slot:
 * a slot stays runnable only until the next one is due. That keeps a late run
 * from ever bleeding into the next slot, so even a tolerance far larger than a
 * cron's interval can never run the same slot twice.
 */
export function planBeat(
  expected: Date,
  now: Date,
  toleranceMs: number,
  getNextMatch: (date: Date) => Date
): BeatPlan {
  const missed: Date[] = [];
  let slot = expected;

  while (true) {
    const nowMs = now.getTime();
    const slotMs = slot.getTime();

    // Timer woke before this slot is due (e.g. the clock moved back). Nothing
    // to run yet; keep waiting for it.
    if (nowMs < slotMs) {
      return { missed, next: slot };
    }

    const next = getNextMatch(slot);

    // Defense in depth: getNextMatch must always advance. If it ever does not
    // (e.g. a bug around a DST boundary), re-base from now to avoid looping
    // forever.
    if (next.getTime() <= slotMs) {
      return { missed, next: getNextMatch(now) };
    }

    const gap = next.getTime() - slotMs;
    const lateBy = nowMs - slotMs;

    // Runnable while we are within tolerance AND the next slot has not arrived
    // yet. The gap bound means a late run can never bleed into the following
    // slot, so a tolerance larger than the interval can never run a slot twice.
    if (lateBy <= toleranceMs && lateBy < gap) {
      return { missed, run: slot, next };
    }

    // Too late for this slot. Report it missed and consider the next one.
    missed.push(slot);
    slot = next;
  }
}
