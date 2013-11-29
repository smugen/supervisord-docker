supervisord-docker
==================

Supervisord and Docker container integration workaround patch

----------

What does Docker proxy do?
> proxies STDIO, signals and exit status code

issues listed below.
- [The main process inside container ignore SIGTERM or even other signals](#issue-1)
- [Supervisord start container that previously stopped abnormally](#issue-2)
- [Further ask Docker host to stop or kill container during system shutdown](#issue-3)

### <a name="issue-1"></a> The main process inside container ignore SIGTERM or even other signals ###
#### scenario description ####
1. Supervisord sends SIGTERM to Docker proxy (`docker start -a name`).
2. Docker proxy forwards signal to container main process, but nothing happened.
3. Supervisord waits until timeout and send SIGKILL, that only kills Docker proxy.
4. Container still running, Supervisord thinks the container already been stopped.

#### workaround ####
Using Supervisord event listener listen to `PROCESS_STATE_STOPPING` event.

1. Receiving `PROCESS_STATE_STOPPING` event.
2. Take first to ask Docker host to stop container.
3. Docker host will take care of SIGTERM timeout, sending SIGKILL to container (main process).

### <a name="issue-2"></a> Supervisord start container that previously stopped abnormally ###
#### scenario description ####
Docker proxy can't reveal actual state of container.
- Error: Impossible to attach to a ghost container
- Error: Cannot start container *name*: The container *id* is already running.
- Error: failed to start one or more containers

Will enter `PROCESS_STATE_EXITED` state and then `PROCESS_STATE_BACKOFF` state.
#### workaround ####
Using Supervisord event listener listen to `PROCESS_STATE_BACKOFF` event.
Asking Docker host to stop container can achieve a temporary effect,
Docker proxy will works normally after several retries.

### <a name="issue-3"></a> Further ask Docker host to stop or kill container during system shutdown ###
#### No way ####
Because at that moment, Docker host already stop receiving command.
