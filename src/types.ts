/**
 * Represents the configuration options for a scheduled task.
 *
 * @property {boolean} [scheduled] - Indicates whether the task should be scheduled. Defaults to `true`.
 * @property {string} [timezone] - Specifies the timezone in which the task should run. Accepts a string in the IANA timezone database format (e.g., "America/New_York").
 * @property {boolean} [catchUp] - Determines if missed executions should be caught up when it misses executins, during blocking io. Defaults to `false`.
 * @property {boolean} [runOnStart] - If `true`, the task will execute immediately upon creation. Defaults to `false`.
 * @property {string} [name] - An optional name for the task, useful for identification and debugging.
 * @property {boolean} [noOverlap] - Ensures that the task does not run concurrently with itself.Defaults to `false`.
 * @property {number} [maxExecutions] - Specifies the maximum number of times the task should execute. If not provided, the task will run indefinitely.
 */
export type Options = {
    scheduled?: boolean;
    timezone?: string;
    catchUp?: boolean;
    runOnStart?: boolean;
    name?: string;
    noOverlap?: boolean;
    maxExecutions?: number;
    onError?: Function
};