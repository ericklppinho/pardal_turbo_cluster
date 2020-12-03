"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
process.env.UV_THREADPOOL_SIZE = '' + 4 * require('os').cpus().length;
const os_1 = __importDefault(require("os"));
const cluster_1 = __importDefault(require("cluster"));
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cpus = os_1.default.cpus().length;
const gc_interval = 60 * 1000;
const timeout = 60 * 1000;
let port = 3333;
if (cluster_1.default.isMaster) {
    console.log('Master process is running');
    cluster_1.default.on('online', (worker) => {
        console.log(`Worker ${worker.id} is online`);
    });
    cluster_1.default.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.id} died with code: ${code}, and signal: ${signal}`);
        console.log(`Respawning worker ${worker.id}`);
        cluster_1.default.fork();
    });
    for (let i = 0; i < cpus; i++) {
        console.log(`Starting a new worker ${i}`);
        cluster_1.default.fork();
    }
    if (!global.gc) {
        console.log('Garbage collection is not exposed');
    }
    else {
        setInterval(global.gc, gc_interval);
    }
}
else {
    let app = express_1.default();
    app.get('/', (req, res) => {
        return res.send('Hello World');
    });
    let httpServer = http_1.default.createServer(app);
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
