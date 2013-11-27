var _ = require('underscore');

module.exports = function (logger) {
  function handler (name, msg) {
    return function () {
      logger.debug(msg, name);
      process.exit();
    };
  }

  function reg_exit_singal (signals, extra_msg) {
    extra_msg = extra_msg || "";
    var msg = extra_msg + "%s received, exiting...";
    if (_.isArray(signals)) {
      _.each(signals, function (v, k, l) {
        process.on(v, handler(v, msg));
      });
    }
    else {
      process.on(signals, handler(signals, msg));
    }
  }

  return {
    reg_exit_singal: reg_exit_singal
  };
};
