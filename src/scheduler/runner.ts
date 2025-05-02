import logger from "src/logger";
import { TrackedPromise } from "src/promise/tracked-promise";
import { TimeMatcher } from "src/time/time-matcher";

type RunnerOptions = {
  noOverlap?: boolean
}

export class Runner {
  timeMatcher: TimeMatcher;
  onMacth: Function;
  noOverlap: boolean;

  heartBeatTimeout?: NodeJS.Timeout;

  constructor(timeMatcher: TimeMatcher, onMacth: Function, options?: RunnerOptions){
      this.timeMatcher = timeMatcher;
      this.onMacth = onMacth;
      this.noOverlap = options == undefined || options.noOverlap === undefined ? false : options.noOverlap;
  }

  start() {
    // TODO: make this configurable
    // reducing to less then 1000 may execute a task twice
    const delay = 1000;
   
    let lastCheck: [number, number];
    let lastExecution: TrackedPromise<any>;

    const heartBeat = async () => {
      // overlap prevention
      if(this.noOverlap && lastExecution && lastExecution.getState() === 'pending'){
        logger.warn('task still running, new execution blocked by overlap prevention!');
        lastCheck = now();
        this.heartBeatTimeout = setTimeout(heartBeat, delay);
        return;
      }

      // missed heart beats verification
      const sinceLastCheck = elapsedMs(lastCheck);
      const pendingChecks = Math.floor(sinceLastCheck / delay);
      if(pendingChecks > 1) {
        logger.warn(`${pendingChecks} missed ticks — possible heartbeat loss due to blocking I/O or heavy CPU usage.`)
      }

      lastExecution = checkAndRun(this.timeMatcher, this.onMacth);
      lastCheck = now();
      this.heartBeatTimeout = setTimeout(heartBeat, delay);
    }
    
    this.heartBeatTimeout = setTimeout(()=>{
      lastCheck = now();
      heartBeat();
    }, delay - currentMillisseconds());
  }

  stop(){
    if(this.heartBeatTimeout) clearTimeout(this.heartBeatTimeout);
  }  
}

function checkAndRun(timeMatcher: TimeMatcher, onMacth: Function): TrackedPromise<any> {
  return new TrackedPromise(async (resolve, reject) => {
    try {
      if(timeMatcher.match(new Date())){
        await onMacth();
      }
      resolve(true);
    } catch (error){
      reject(error);
    }
  });
}

function currentMillisseconds(){
  return new Date().getMilliseconds();
}

function elapsedMs(initial: [number, number]): number {
  const elapsed = process.hrtime(initial);
  const secondsAsNanoseconds = elapsed[0] * 1e9;
  const nanoSeconds = elapsed[1];
  const elapsedMs = (secondsAsNanoseconds + nanoSeconds) / 1e6;
  return elapsedMs;
}

function now(): [number, number]{
  return process.hrtime();
}