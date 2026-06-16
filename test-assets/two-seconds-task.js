export async function task() {
  await new Promise(resolve => { setTimeout(resolve, 2000)});
  return 'two seconds task';
}