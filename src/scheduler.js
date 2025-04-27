'use strict';

import EventEmitter from 'events';
import TimeMatcher from './time-matcher.js';

class Scheduler extends EventEmitter{
    constructor(pattern, timezone, autorecover){
        super();
        this.timeMatcher = new TimeMatcher(pattern, timezone);
        this.autorecover = autorecover;
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
            const missedExecutions = Math.floor(elapsedMs / 1000);
            
            for(let i = missedExecutions; i >= 0; i--){
                const date = new Date(new Date().getTime() - i * 1000);
                if(lastExecution.getTime() < date.getTime() && (i === 0 || this.autorecover) && this.timeMatcher.match(date)){
                    this.emit('scheduled-time-matched', {
                      date: date,
                      missedExecutions: i,
                      matchedDate: this.timeMatcher.dtf.format(date)
                    });
                    date.setMilliseconds(0);
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
