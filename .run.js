const cron = require('./src/node-cron');

const jobCounts = [ 0, 0, 0, 0, 0, 0, 0, 0 ]
function startJob (i) {
  new cron.schedule('* * * * * *', function () { /* eslint-disable-line */
    jobCounts[i]++
    console.log(new Date().getSeconds(), i, jobCounts[i])
  })
}
jobCounts.forEach((val, i) => {
  startJob(i)
})