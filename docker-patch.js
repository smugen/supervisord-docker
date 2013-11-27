var winston = require('winston'),
    supervisor = require('supervisord-eventlistener'),
    docker = new(require('dockerode'))
                  ({socketPath: '/var/run/docker.sock'});
                  /*({host: 'http://localhost',
                    port: 4243});*/

var log = new winston.Logger();
var signal = require('./signal')(log);
log.add(winston.transports.Console,
        {timestamp: true, level: "debug"});

function patch_stop (name) {
  var container = docker.getContainer(name);
  container.stop(function (err, data) {
    if (err)
      log.error(err, data);
    else
      log.debug("STOPPED", name);
  });
}

function do_patch (headers, data) {
  if (data.processname.match(/\-docker$/)) {
    patch_stop(data.processname.replace(/\-docker$/, ''));
  }
}

supervisor.on('PROCESS_STATE_STOPPING', do_patch);
supervisor.on('PROCESS_STATE_BACKOFF', do_patch);
// supervisor.on('PROCESS_STATE_EXITED', do_patch);
supervisor.on('event', function (type, headers, data) {
  log.debug(type, data);
});
supervisor.listen(process.stdin, process.stdout);

process.on('SIGTERM', function () {
  log.debug("SIGTERM received, wait for 1s...");
  setTimeout(function () {
    log.debug("exiting...");
    process.exit();
  }, 1000);
});

signal.reg_exit_singal('SIGUSR2', "Maybe from supervisord, ");
signal.reg_exit_singal(['SIGHUP',
                        'SIGINT',
                        'SIGQUIT',
                        'SIGBREAK']);
