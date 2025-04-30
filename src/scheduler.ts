'use strict';

import EventEmitter from 'events';
import TimeMatcher from './time-matcher';
import { CronEvent } from './types';

class Scheduler extends EventEmitter{
    timeMatcher: TimeMatcher;
    catchUp: any;
    running: boolean;
    timeout?: NodeJS.Timeout | null;

    constructor(pattern, timezone?, catchUp?){
        super();
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
                    const event: CronEvent = {
                      date: date,
                      missedCount: i,
                      dateLocalIso: this.toLocalizedIso(date),
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

    toLocalizedIso(date: Date) {
      const parts = this.timeMatcher.dtf.formatToParts(date).filter(part => {
        return part.type !== 'literal';
      }).reduce((acc:any, part) => {
          acc[part.type] = part.value;
          return acc;
      }, {});

      const offset = parts.timeZoneName.replace(/^GMT/, '');
    
      return `${parts.year}-${parts.month}-${parts.day}`
           + `T${parts.hour}:${parts.minute}:${parts.second}.${String(date.getMilliseconds()).padStart(3, '0')}`
           + offset;
    }
}

export default Scheduler;
