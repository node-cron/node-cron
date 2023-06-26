'use strict';

const EventEmitter = require('events');
const TimeMatcher = require('./time-matcher');

class Scheduler extends EventEmitter{
    constructor(pattern, timezone){
        super();
        this.timeMatcher = new TimeMatcher(pattern, timezone);
    }

    start(){
        // clear timeout if exists
        this.stop();

        let lastCheck = process.hrtime();
        let lastExecution = this.timeMatcher.apply(new Date());

        const matchTime = () => {
            const delay = 1000;
            const elapsedTime = process.hrtime(lastCheck);
            const elapsedMs = (elapsedTime[0] * 1e9 + elapsedTime[1]) / 1e6;
            const missedExecutions = Math.floor(elapsedMs / 1000);
            
            for(let i = missedExecutions; i >= 0; i--){
                const date = new Date(new Date().getTime() - i * 1000);
                let date_tmp = this.timeMatcher.apply(date);
                if ((lastExecution.getTime() < date_tmp.getTime()) && i === 0 && this.timeMatcher.match(date)){
                    date_tmp.setMilliseconds(0);
                    this.emit('scheduled-time-matched', date_tmp);
                    lastExecution = date_tmp;
                }
            }
            lastCheck = process.hrtime();
            this.timeout = setTimeout(matchTime, delay);
        };
        matchTime();
    }

    stop(){
        if(this.timeout){
            clearTimeout(this.timeout);
        }
        this.timeout = null;
    }
}

module.exports = Scheduler;
