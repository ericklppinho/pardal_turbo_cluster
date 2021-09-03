"use strict";

var _cluster = _interopRequireDefault(require("cluster"));

var _http = _interopRequireDefault(require("http"));

var _child_process = _interopRequireDefault(require("child_process"));

var _roundrobin = _interopRequireDefault(require("./roundrobin"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const port = 3333;
const cpus = 5;
const servers_per_worker = 10;
process.env.UV_THREADPOOL_SIZE = '' + 4 * cpus * servers_per_worker;
const gc_interval = 30 * 1000;
const timeout = 30 * 1000;

if (_cluster.default.isMaster) {
  console.log('Master process is running');

  _cluster.default.on('online', worker => {
    console.log(`Worker ${worker.process.pid} is online`);
  });

  _cluster.default.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
    console.log(`Respawning worker ${worker.process.pid}`);

    _cluster.default.fork();
  });

  for (let i = 0; i < cpus; i++) {
    //console.log(`Starting a new worker ${i}`);
    _cluster.default.fork();
  }

  if (!global.gc) {
    console.log('Garbage collection is not exposed');
  } else {
    setInterval(global.gc, gc_interval);
  }
} else {
  const servers = [];

  for (let i = 0; i < servers_per_worker; i++) {
    servers[i] = _child_process.default.fork(`${__dirname}/server.js`);
    servers[i].on('exit', (code, signal) => {
      console.log(`Server ${servers[i].pid} died with code: ${code}, and signal: ${signal}`);
      console.log(`Respawning server ${servers[i].pid} from worker ${process.pid}`);
      servers[i] = _child_process.default.fork(`${__dirname}/server.js`);
    });
  }

  const nextServer = (0, _roundrobin.default)(servers);
  _http.default.globalAgent.maxFreeSockets = 10000;
  _http.default.globalAgent.maxSockets = 1000000;
  _http.default.globalAgent.maxTotalSockets = 1000000;

  const server = _http.default.createServer();

  server.on('connection', socket => {
    socket.pause();
    socket.setNoDelay();
    socket.setKeepAlive();
    nextServer().send('pardal_turbo_server:connection', socket);
  });
  server.listen(port, () => {
    console.log('🚀 Listening on port ' + port);
  });
}