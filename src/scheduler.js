'use strict';

const events = require('events');
const util = require('util');
const TimeMatcher = require('./time-matcher');

class Scheduler{
    constructor(pattern, timezone){
        this.timeMatcher = new TimeMatcher(pattern, timezone);
        events.EventEmitter.call(this);
    }

    start(){
        // clear timeout if exsits
        if(this.timeout){
            clearTimeout(this.timeout);
        }
        var matchTime = () => {
            var now = new Date();
            if(this.timeMatcher.match(now)){
                this.emit('scheduled-time-matched', now);
            }
            this.timeout = setTimeout(matchTime, 1000 - now.getMilliseconds() + 1);
        }
        this.timeout = setTimeout(matchTime, 1000 - new Date().getMilliseconds() + 1);
    }
}

util.inherits(Scheduler, events.EventEmitter);
module.exports = Scheduler;