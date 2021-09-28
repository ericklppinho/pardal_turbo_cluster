process.env.UV_THREADPOOL_SIZE= '' + 128; // 1-128 or 1-1024 depending of the version

const port = 3333;
const cpus = 1;
const servers_per_worker = 5;

import cluster from 'cluster';
import net from 'net';
import child_process, { ChildProcess } from 'child_process';
import roundrobin from './roundrobin';

const gc_interval = 30 * 1000;
const connection_timeout = 30 * 1000;

if (cluster.isMaster) {
    cluster.on('online', (worker) => {
        console.log(`Worker ${worker.process.pid} is online`);
    });

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
        console.log(`Respawning worker ${worker.process.pid}`);
        cluster.fork();
    });

    for (let i = 0; i < cpus; i++) {
        cluster.fork();
    }

    if (!global.gc) {
        console.log('Garbage collection is not exposed');
    } else {
        setInterval(global.gc, gc_interval);
    }
} else {
    const servers: ChildProcess[] = [];

    for (let i = 0; i < servers_per_worker; i++) {
        servers[i] = child_process.fork(`${__dirname}/server.js`);

        servers[i].on('exit', (code, signal) => {
            console.log(`Server ${servers[i].pid} died with code: ${code}, and signal: ${signal}`);
            console.log(`Respawning server ${servers[i].pid} from worker ${process.pid}`);
            servers[i] = child_process.fork(`${__dirname}/server.js`);
        });
    }

    const nextServer = roundrobin<ChildProcess>(servers);

    const server = net.createServer({ pauseOnConnect: true }, (socket) => {
        socket.setNoDelay();
        socket.setKeepAlive();
        socket.setTimeout(connection_timeout);
        socket.on('timeout', () => {
            socket.end();
        });

        nextServer().send('socket', socket);
    });

    server.listen(port, () => {
        console.log('🚀 Listening on port ' + port);
    });
}
