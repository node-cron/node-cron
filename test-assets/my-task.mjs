export function task() {
  throw new Error('asdf')
}


// cron.schedule('* * * * * *', async (e) => {
//  console.log('testing task');
 
//  await new Promise((resolve) => {
//   setTimeout(() => {
//     resolve();
//   }, 5000);
//  });

//  console.log('done')
// }, {
//   maxExecutions: 2,
//   noOverlap: true,
//   onError: (e) => {
//     console.log(e)
//   },
// });

// cron.schedule('* * * * * *', ()=> {
//   throw Error('asdf')
// }, {
//   onError: (error) => {
//     console.log(error)
//   }
// })
