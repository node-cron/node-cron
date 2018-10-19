'use strict';

const EventEmitter = require('events');
const TimeMatcher = require('./time-matcher');

class Scheduler extends EventEmitter{
    constructor(pattern, timezone, autorecover){
        super();
        this.timeMatcher = new TimeMatcher(pattern, timezone);
        this.autorecover = autorecover;
    }

    start(){
        // clear timeout if exsits
        this.stop();

        let lastCheck = process.hrtime();
        let lastExecution = new Date();

        var matchTime = () => {
            const delay = 1000;
            const elapsedTime = process.hrtime(lastCheck);
            const elapsedMs = (elapsedTime[0] * 1e9 + elapsedTime[1]) / 1e6;
            const missedExecutions = Math.floor(elapsedMs / 1000);
            
            for(let i = missedExecutions; i >= 0; i--){
                var date = new Date(new Date().getTime() - i * 1000);
                if(lastExecution.getTime() < date.getTime() && (i === 0 || this.autorecover) && this.timeMatcher.match(date)){
                    this.emit('scheduled-time-matched', date);
                    date.setMilliseconds(0);
                    lastExecution = date;
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