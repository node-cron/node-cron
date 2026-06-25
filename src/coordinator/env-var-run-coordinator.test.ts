import { EnvVarRunCoordinator } from './env-var-run-coordinator';

describe('EnvVarRunCoordinator', function () {
  afterEach(() => {
    delete process.env.NODE_CRON_RUN;
    delete process.env.CUSTOM_RUN_FLAG;
  });

  it('throws on construction when the env var is unset (fails fast at startup)', function () {
    expect(() => new EnvVarRunCoordinator()).toThrow(/NODE_CRON_RUN/);
  });

  it('throws when the env var is set to an invalid value', function () {
    process.env.NODE_CRON_RUN = 'yes';
    expect(() => new EnvVarRunCoordinator()).toThrow(/'true' or 'false'/);
  });

  it('shouldRun returns true when the env var is "true"', function () {
    process.env.NODE_CRON_RUN = 'true';
    const coordinator = new EnvVarRunCoordinator();
    expect(coordinator.shouldRun()).toBe(true);
  });

  it('shouldRun returns false when the env var is "false"', function () {
    process.env.NODE_CRON_RUN = 'false';
    const coordinator = new EnvVarRunCoordinator();
    expect(coordinator.shouldRun()).toBe(false);
  });

  it('honours a custom env var name', function () {
    process.env.CUSTOM_RUN_FLAG = 'true';
    const coordinator = new EnvVarRunCoordinator('CUSTOM_RUN_FLAG');
    expect(coordinator.shouldRun()).toBe(true);
  });

  it('re-reads the env on each call and throws if it becomes invalid', function () {
    process.env.NODE_CRON_RUN = 'true';
    const coordinator = new EnvVarRunCoordinator();
    delete process.env.NODE_CRON_RUN;
    expect(() => coordinator.shouldRun()).toThrow(/NODE_CRON_RUN/);
  });
});
