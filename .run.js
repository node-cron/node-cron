// const cron = require('./src/node-cron');

// const jobCounts = [ 0, 0, 0, 0, 0, 0, 0, 0 ]
// function startJob (i) {
//   new cron.schedule('* * * * * *', function () { /* eslint-disable-line */
//     jobCounts[i]++
//     console.log(new Date().getSeconds(), i, jobCounts[i])
//   })
// }
// jobCounts.forEach((val, i) => {
//   startJob(i)
// })

const NS_PER_SEC = 1e9;
const time = process.hrtime();
console.log(time);

setTimeout(() => {
  const diff = process.hrtime(time);
  console.log(diff);

  console.log(`Benchmark took ${(diff[0] * NS_PER_SEC + diff[1]) / 1e6} miliseconds`);
}, 0);