"use strict";

var _http = _interopRequireDefault(require("http"));

var _express = _interopRequireDefault(require("express"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let app = (0, _express.default)();
app.get('/', (req, res) => {
  return res.send('Hello World');
});

const server = _http.default.createServer(app); // server.requestTimeout = timeout;
// server.headersTimeout = timeout;
// server.timeout = timeout;
// server.keepAliveTimeout = timeout;


server.listen(0, () => {
  console.log(`Server ${process.pid} started from worker ${process.ppid}`);
});
process.on('message', (type, socket) => {
  if (type === 'pardal_turbo_server:connection') {
    server.emit('connection', socket);
    socket.resume();
  }
});