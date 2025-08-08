const cron = require('./dist/node-cron.cjs');

const task = cron.schedule('43 3 * * Fri', async () => {
  console.log('JOB');
});

console.log(`Next run: ${task.getNextRun()}`);

task.destroy()