export async function task() {
  blockIO(2000)
  return 'two seconds task';
}

function blockIO(ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {
  }
}