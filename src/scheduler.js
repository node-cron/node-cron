'use strict';

var events = require('events');
const tzOffset = require('tz-offset');

var validatePattern = require('./pattern-validation');
var convertExpression = require('./convert-expression');

function matchPattern(pattern, value){
    if( pattern.indexOf(',') !== -1 ){
        var patterns = pattern.split(',');
        return patterns.indexOf(value.toString()) !== -1;
    }
    return pattern === value.toString();
}

function Scheduler(pattern, timezone){
    validatePattern(pattern);
    this.pattern = convertExpression(pattern);
    this.timezone = timezone;
    this.expressions = this.pattern.split(' ');
}

Scheduler.prototype = events.EventEmitter.prototype;

Scheduler.prototype.start = function(){
    // clear timeout if exsits
    if(this.timeout){
        clearTimeout(this.timeout);
    }

    let locker;

    var matchTime = () => {
        var now = new Date();
        if(this.timezone){
            now = tzOffset.timeAt(now, this.timezone)
        }
        var runOnSecond = matchPattern(this.expressions[0], now.getSeconds());
        var runOnMinute = matchPattern(this.expressions[1], now.getMinutes());
        var runOnHour = matchPattern(this.expressions[2], now.getHours());
        var runOnDay = matchPattern(this.expressions[3], now.getDate());
        var runOnMonth = matchPattern(this.expressions[4], now.getMonth() + 1);
        var runOnWeekDay = matchPattern(this.expressions[5], now.getDay());

        if(runOnSecond && runOnMinute && runOnHour && runOnDay && runOnMonth && runOnWeekDay){
            let currentKey = `${now.getDate()}-${now.getMonth()}-${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
            if(currentKey !== locker){
                this.emit('scheduled-time-matched', now);
            } else {
                console.log('execution locked!');
            }
            locker = currentKey;
        }

        this.timeout = setTimeout(matchTime, 1000 - now.getMilliseconds() + 1);
    }
    this.timeout = setTimeout(matchTime, 1000 - new Date().getMilliseconds() + 1);
}

module.exports = Scheduler;