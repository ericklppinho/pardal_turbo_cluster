import http from 'http';
import express from 'express';

let app = express();

app.get('/', (req, res) => {
  return res.send('Hello World');
});

const server = http.createServer(app);

// server.requestTimeout = timeout;
// server.headersTimeout = timeout;
// server.timeout = timeout;
// server.keepAliveTimeout = timeout;

server.listen(0, () => {
  console.log(`Server ${process.pid} started from worker ${process.ppid}`);
});

process.on('message', (type, socket) => {
  if(type === 'pardal_turbo_server:connection') {
    server.emit('connection', socket);
    socket.resume();
  }
});