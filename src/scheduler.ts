import validatePattern from './pattern/validation/pattern-validation';
import EventEmitter from 'events';
import { TimeMatcher } from './time/time-matcher';
import { LocalizedTime } from './time/localized-time';
import { TaskEvent } from './tasks/task-event';

class Scheduler extends EventEmitter{
    timeMatcher: TimeMatcher;
    catchUp: any;
    running: boolean;
    timeout?: NodeJS.Timeout | null;
    timezone?: string;

    constructor(pattern, timezone?, catchUp?){
        super();

        validatePattern(pattern);
      
        this.timezone = timezone;
        this.timeMatcher = new TimeMatcher(pattern, timezone);
        this.catchUp = catchUp;
        this.running = false;
    }

    start(){
        // prevent starting twice
        if(this.running){
           return;
        }

        this.running = true;

        let lastCheck = process.hrtime();
        let lastExecution = new Date();

        const matchTime = () => {
            const delay = 1000;
            const elapsedTime = process.hrtime(lastCheck);
            const elapsedMs = (elapsedTime[0] * 1e9 + elapsedTime[1]) / 1e6;
            const missedCount = Math.floor(elapsedMs / delay);
            
            for(let i = missedCount; i >= 0; i--){
                const date = new Date(new Date().getTime() - i * delay);
                if(lastExecution.getTime() < date.getTime() && (i === 0 || this.catchUp) && this.timeMatcher.match(date)){
                  const localizedDate = new LocalizedTime(date, this.timezone);
                    const event: TaskEvent = {
                      date:  localizedDate.toDate(),
                      missedCount: i,
                      dateLocalIso: localizedDate.toISO(),
                      reason: 'time-matched'
                    };
                    this.emit('scheduled-time-matched', event);
                    lastExecution = date;
                }
            }
            lastCheck = process.hrtime();

            if(this.running){
              this.timeout = setTimeout(matchTime, delay);
            }
        };
        matchTime();
    }

    stop(){
        this.running = false;
        if(this.timeout){
            clearTimeout(this.timeout);
        }
        this.timeout = null;
    }
}

export default Scheduler;
