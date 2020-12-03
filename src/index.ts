import os from 'os';

process.env.UV_THREADPOOL_SIZE = '' + 4 * os.cpus.length;

import cluster from 'cluster';
import http from 'http';
import express from 'express';

const cpus = os.cpus.length;
const gc_interval = 60 * 1000;
const timeout = 60 * 1000;

let port = 3333;

if (cluster.isMaster) {
    console.log('Master process is running');

    cluster.on('online', (worker) => {
        console.log(`Worker ${worker.id} is online`);
    });

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.id} died with code: ${code}, and signal: ${signal}`);
        console.log(`Respawning worker ${worker.id}`);
        cluster.fork();
    });

    for (let i = 0; i < cpus; i++) {
        console.log(`Starting a new worker ${i}`);
        cluster.fork();
    }

    if (!global.gc) {
        console.log('Garbage collection is not exposed');
    } else {
        setInterval(global.gc, gc_interval);
    }
} else {
    let app = express();

    app.get('/', (req, res) => {
        return res.send('Hello World');
    });

    let httpServer = http.createServer(app);

    httpServer.requestTimeout = timeout;
    httpServer.headersTimeout = timeout;
    httpServer.timeout = timeout;
    httpServer.keepAliveTimeout = timeout;

    httpServer.on('connection', (connection) => {
        connection.setNoDelay();
        connection.setKeepAlive();
        //connection.setTimeout(timeout);

        return;
    });

    httpServer.listen(port, () => {
        console.log('🚀 Listening on port ' + port);
    });
}