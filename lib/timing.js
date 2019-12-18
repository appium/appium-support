import _ from 'lodash';


const DURATION_SECONDS = 's';
const DURATION_MILLIS = 'ms';
const DURATION_NANOS = 'ns';

const NS_PER_SEC = 1e9;
const NS_PER_MS = 1e6;

const CONVERSION_FACTORS = {
  [DURATION_SECONDS]: NS_PER_SEC,
  [DURATION_MILLIS]: NS_PER_MS,
  [DURATION_NANOS]: 1,
};


/**
 * Class representing a duration, encapsulating the number and units.
 */
class Duration {
  constructor (duration, units) {
    this._duration = duration;
    this._units = units;
  }

  get duration () {
    return this._duration;
  }

  get units () {
    return this._units;
  }

  toString () {
    return `${this.duration}${this.units}`;
  }
}

class Timer {
  constructor () {
    this._startTime = null;
  }

  get startTime () {
    return this._startTime;
  }

  /**
   * Start the timer
   *
   * @return {Timer} The current instance, for chaining
   */
  start () {
    if (!_.isNull(this.startTime)) {
      throw new Error('Timer has already been started.');
    }
    // once Node 10 is no longer supported, this check can be removed
    this._startTime = _.isFunction(process.hrtime.bigint)
      ? process.hrtime.bigint()
      : process.hrtime();
    return this;
  }

  /**
   * @typedef {Object} GetDurationOptions
   *
   * @property {?string} units - the units to convert to. Can be one of
   *     - 's' - seconds (default)
   *     - 'ms' - milliseconds
   *     - 'ns' - nanoseconds
   * @property {?boolean} round - whether or not the result should be rounded to
   *                              the nearest integer
   */

  /**
   * Get the duration since the timer was started
   *
   * @param {?string|GetDurationOptions} opts - options for conversion of duration.
   *     Can be a String representing the units ('s', 'ms', or 'ns') or an Object
   * @return {Duration} the duration, in the specified units
   */
  getDuration (opts = {}) {
    if (_.isNull(this.startTime)) {
      throw new Error(`Unable to get duration. Timer was not started`);
    }

    if (_.isString(opts)) {
      opts = {
        units: opts,
      };
    }
    const {
      units = DURATION_SECONDS,
      round = true,
    } = opts;

    if (!_.keys(CONVERSION_FACTORS).includes(units)) {
      throw new Error(`Unknown unit for duration conversion: '${units}'. Available units: ${_.keys(CONVERSION_FACTORS).join(', ')}`);
    }

    let nanoDuration;
    if (_.isArray(this.startTime)) {
      // startTime was created using process.hrtime()
      const [seconds, nanos] = process.hrtime(this.startTime);
      nanoDuration = seconds * NS_PER_SEC + nanos;
    } else if (typeof this.startTime === 'bigint' && _.isFunction(process.hrtime.bigint)) {
      // startTime was created using process.hrtime.bigint()
      const endTime = process.hrtime.bigint();
      // get the difference, and convert to number
      nanoDuration = Number(endTime - this.startTime);
    } else {
      throw new Error(`Unable to get duration. Start time '${this.startTime}' cannot be parsed`);
    }

    const duration = nanoDuration / CONVERSION_FACTORS[units];
    return new Duration(round ? Math.round(duration) : duration, units);
  }
}


export {
  Timer, Duration,
  DURATION_MILLIS, DURATION_SECONDS, DURATION_NANOS,
};
export default Timer;
