import type { RunCoordinator } from "./run-coordinator";

/**
 * The default run coordinator: a designated single instance runs distributed
 * tasks, decided by an env var (default `NODE_CRON_RUN`). Set it to `'true'` on
 * exactly one instance and `'false'` on the others. There is no default value —
 * a missing/invalid env throws, so a misconfigured fleet fails loudly at
 * startup instead of silently running everywhere (duplicates) or nowhere.
 *
 * This is a single designated runner, not HA: if that instance is down, nothing
 * runs. For HA, per-fire coordination, provide a Redis-backed RunCoordinator.
 */
export class EnvVarRunCoordinator implements RunCoordinator {
  constructor(private readonly envName: string = 'NODE_CRON_RUN') {
    // Validate eagerly so the failure happens at schedule time (startup),
    // not at the first fire.
    this.read();
  }

  shouldRun(): boolean {
    return this.read();
  }

  private read(): boolean {
    const value = process.env[this.envName];
    if (value !== 'true' && value !== 'false') {
      throw new Error(
        `node-cron: a \`distributed\` task needs ${this.envName} set to 'true' or 'false'. ` +
        `Set it to 'true' on exactly one instance and 'false' on the others, ` +
        `or provide a coordinator via cron.setRunCoordinator(...).`
      );
    }
    return value === 'true';
  }
}
