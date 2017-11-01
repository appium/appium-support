import npmlog from 'npmlog';
import _ from 'lodash';


// levels that are available from `npmlog`
const NPM_LEVELS = ['silly', 'verbose', 'debug', 'info', 'http', 'warn', 'error'];
const MAX_LOG_RECORDS_COUNT = 3000;

// mock log object used in testing mode
let mockLog = {};
for (let level of NPM_LEVELS) {
  mockLog[level] = () => {};
}

function patchLogger (logger) {
  if (!logger.debug) {
    logger.addLevel('debug', 1000, { fg: 'blue', bg: 'black' }, 'dbug');
  }
}

function _getLogger () {
  // check if the user set the `_TESTING` or `_FORCE_LOGS` flag
  const testingMode = parseInt(process.env._TESTING, 10) === 1;
  const forceLogMode = parseInt(process.env._FORCE_LOGS, 10) === 1;

  // if is possible that there is a logger instance that is already around,
  // in which case we want t o use that
  const usingGlobalLog = !!global._global_npmlog;
  let logger;
  if (testingMode && !forceLogMode) {
    // in testing mode, use a mock logger object that we can query
    logger = mockLog;
  } else {
    // otherwise, either use the global, or a new `npmlog` object
    logger = global._global_npmlog || npmlog;
    // The default value is 10000, which causes excessive memory usage
    logger.maxRecordSize = MAX_LOG_RECORDS_COUNT;
  }
  patchLogger(logger);
  return [logger, usingGlobalLog];
}

function getLogger (prefix = null) {
  let [logger, usingGlobalLog] = _getLogger();

  // wrap the logger so that we can catch and modify any logging
  let wrappedLogger = {unwrap: () => logger};

  // allow access to the level of the underlying logger
  Object.defineProperty(wrappedLogger, 'level', {
    get: () => { return logger.level; },
    set: (newValue) => { logger.level = newValue; },
    enumerable: true,
    configurable: true
  });
  // This lambda function is necessary to workaround unexpected memory leaks
  // caused by NodeJS behavior described in https://bugs.chromium.org/p/v8/issues/detail?id=2869
  const unleakIfString = (x) => _.isString(x) ? ` ${x}`.substr(1) : x;
  // add all the levels from `npmlog`, and map to the underlying logger
  for (let level of NPM_LEVELS) {
    wrappedLogger[level] = (...args) => logger[level].call(logger,
      _.isFunction(prefix) ? prefix() : prefix,
      ...(args.map(unleakIfString)));
  }
  // add method to log an error, and throw it, for convenience
  wrappedLogger.errorAndThrow = function (err) {
    // make sure we have an `Error` object. Wrap if necessary
    if (!(err instanceof Error)) {
      err = new Error(err);
    }
    // log and throw
    this.error(unleakIfString(err));
    throw err;
  };
  if (!usingGlobalLog) {
    // if we're not using a global log specified from some top-level package,
    // set the log level to a default of verbose. Otherwise, let the top-level
    // package set the log level
    wrappedLogger.level = 'verbose';
  }
  wrappedLogger.levels = NPM_LEVELS;
  return wrappedLogger;
}

// export a default logger with no prefix
const log = getLogger();

export { log, patchLogger, getLogger };
export default log;
