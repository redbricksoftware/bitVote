import * as moment from 'moment';
import * as Promise from 'Promise';
import {error} from 'util';

export class TimeKeeper {
    private timers: {} = new Object();
    private debug: boolean = false;

    constructor(debug: boolean = false){
        this.debug = debug
    }

    public startTimer(timerName: string): string {

        if (this.debug) {
            let timerCount: number = 1;
            let timerNameInc = timerName + timerCount;

            while (this.timers[timerNameInc]) {
                timerCount++;
                timerNameInc = timerName + timerCount;
            }

            this.timers[timerNameInc] = new Timers();

            this.timers[timerNameInc].name = timerNameInc;
            this.timers[timerNameInc].startTime = moment.now();

            return timerNameInc;
        }
        return '';
    }

    public stopTimer(timerName: string) {
        if (this.debug) {

            if (this.timers.hasOwnProperty(timerName)) {
                this.timers[timerName].stopTime = moment.now();
            } else {
                throw error('Timer Not Found');
            }
        }
    };

    public timerReport() {
        if (this.debug) {
            console.log('TimeKeeper Report');
            Object.keys(this.timers).forEach(key => {
                if (this.timers[key].startTime) {
                    if (this.timers[key].stopTime) {
                        let timeInMS = moment(this.timers[key].stopTime).diff(moment(this.timers[key].startTime));
                        console.log(this.timers[key].name + ': ' + timeInMS + 'ms');
                    } else {
                        console.log(this.timers[key].name + ' start: ' + moment(this.timers[key].startTime).format());
                    }
                } else {
                    console.log(this.timers[key].name + ' not started.');
                }
            });
        }
    }
}

export class Timers {
    name: string;
    startTime: moment.Moment;
    stopTime: moment.Moment;
}