const port = 3333;
const cpus = 5;
const servers_per_worker = 10;

process.env.UV_THREADPOOL_SIZE = '' + 4 * cpus * servers_per_worker;

import cluster from 'cluster';
import net from 'net';
import cp, { ChildProcess } from 'child_process';
import roundrobin from './roundrobin';

const gc_interval = 30 * 1000;
const timeout = 30 * 1000;

if (cluster.isMaster) {
    console.log('Master process is running');

    cluster.on('online', (worker) => {
        console.log(`Worker ${worker.process.pid} is online`);
    });

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
        console.log(`Respawning worker ${worker.process.pid}`);
        cluster.fork();
    });

    for (let i = 0; i < cpus; i++) {
        //console.log(`Starting a new worker ${i}`);
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
        servers[i] = cp.fork(`${__dirname}/server.js`);

        servers[i].on('exit', (code, signal) => {
            console.log(`Server ${servers[i].pid} died with code: ${code}, and signal: ${signal}`);
            console.log(`Respawning server ${servers[i].pid} from worker ${process.pid}`);
            servers[i] = cp.fork(`${__dirname}/server.js`);
        });
    }

    const nextServer = roundrobin<ChildProcess>(servers);

    var serverOptions = { pauseOnConnect: true };

    const server = net.createServer(serverOptions, (socket) => {
        socket.setNoDelay();
        socket.setKeepAlive();
        socket.setTimeout(timeout);

        nextServer().send('pardal_turbo_server:connection', socket);
    });

    server.listen(port, () => {
        console.log('🚀 Listening on port ' + port);
    });
}