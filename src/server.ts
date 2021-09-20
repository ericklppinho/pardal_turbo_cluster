import { Socket } from 'net';
import http from 'http';
import express, { Express } from 'express';
import cors from 'cors';
import compression from 'compression';

const app: Express = express();

app.use(cors());
app.use(compression());
app.use(express.json());

app.get('/', async (req, res) => {  // Use async by default
  return res.send({'Hello': 'World'});
});

const server: http.Server = http.createServer(app);

server.listen(0, () => {
  console.log(`Server ${process.pid} started from worker ${process.ppid}`);
});

process.on('message', (type: string, socket: Socket) => {
  if(type === 'socket') {
    server.emit('connection', socket);
  }
});
