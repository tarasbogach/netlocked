const fs = require('fs');
const net = require('net');
const tls = require('tls');
const {promisify} = require('util');
const yargs = require('yargs');
const Socket = require('./Socket.js');
const Semaphore = require('./Semaphore.js');

class Server {

    constructor() {
        this.id = 0;
        /**
         *
         * @type {{
         *  socket: {
         *      byId: Map<Number, Socket>,
         *  },
         *  vhost: Map<String, {
         *    lock: Map<String, Semaphore>
         *    semaphore: Map<String, Semaphore>
         *  }>
         * }}
         */
        this.index = {
            vhost: new Map(['default', {
                lock: new Map(),
                semaphore: new Map(),
            }]),
        };
        this.initConfig();
        this.initDatabase();
        this.initNet();
        (async () => {
            await this.listen();
            process.on('SIGINT', () => {
                this.exit();
            })
        })().catch((error) => {
            console.error(error);
            process.exit();
        });
    }

    exit() {
        this.net.close();
    }

    initDatabase() {
        let path = this.config.database;
        let db;
        if (fs.accessSync(path, fs.constants.F_OK)) {
            let db = fs.readFileSync(path);
            db = JSON.parse(db);
        } else {
            let salt = crypto.randomBytes(16);
            let username = 'admin';
            let password = crypto.createHmac('sha1', salt);
            password.update(username);
            db = {
                user: [
                    {
                        username: username,
                        password: password.toString('base64'),
                        salt: salt.toString('base64'),
                        credential: ['admin', 'user',],
                        vhost: ['default',],
                    },
                ],
                vhost:['default',],
            };
            fs.writeFileSync(path, JSON.stringify(db, null, "\t"));
        }
        this.db = db;
    }

    async listen() {
        let target = this.config.listen.toString();
        let listen = (...args) => {
            return new Promise((resolve, reject) => {
                this.net.listen(...args, (error) => {
                    error ? reject() : resolve();
                });
            });
        };
        console.info(`Try to listen on '${target}'.`)
        switch (true) {
            case !!target.match(/\//):
                try {
                    await promisify(fs.access)(target)
                        .then(() => promisify(fs.unlink)(target))
                        .then(() => listen(target));
                } catch (error) {
                    await listen(target);
                }
                break;
            case !!target.match(/^.*:[0-9]+$/):
                let parse = target.split(':');
                let port = parse.pop();
                let host = parse.join(':');
                await listen(port, host);
                break;
            case !!target.match(/^[0-9]+$/):
                await listen(target);
                break;
            default:
                throw new Error('Unknown listen type');
                break;

        }
        console.info(`Listening on '${target}'.`)
    }

    initNet() {
        if (this.config.tls === true) {
            this.net = tls.createServer({
                key: fs.readFileSync(this.config.tlsKey),
                cert: fs.readFileSync(this.config.tlsCert),
            });
        } else {
            this.net = net.createServer();
        }
        this.net.on('connection', (socket) => {
            let id = this.id++;
            let socket = new Socket(socket, id);
            this.onConnect(socket);
        })
    }

    /**
     *
     * @param {Socket} socket
     */
    onDisconnect(socket){
        this.index.socket.byId.delete(socket.getId());
        console.log(this.index);
    }

    /**
     *
     * @param {Socket} socket
     */
    onConnect(socket){
        socket.on('message', /** @param {Message} message */(message) => {
            this.onMessage(socket, message);
        });
        socket.on('end',() => {
            this.onDisconnect(socket);
        });
        this.index.socket.byId.set(socket.getId(), socket);
        console.log(this.index);
    }

    /**
     *
     * @param {Socket} socket
     * @param {Message} message
     */
    onMessage(socket, message) {
        console.info(message);
        if(this.exec.has(message.command)){

        }else{
            this.send(new Message())
        }
    }

    initConfig() {
        let def = {
            tlsKey: '/var/lib/netlocked/key.pem',
            tlsCert: '/var/lib/netlocked/cert.pem',
        }
        this.config = yargs
            .pkgConf('netlocked')
            .option('config', {
                alias: 'c',
                desc: 'Path to configuration file JSON.',
                config: true,
            })
            .option('database', {
                alias: 'db',
                desc: 'Path to persistance database file.',
                default: '/var/lib/netlocked/db.json',
                normalize: true,
            })
            .option('listen', {
                alias: 'l',
                group: 'Networking',
                desc: 'Path to unix socket or host:port to listen on.\nExamples: "/run/netlocked.sock", "127.0.0.1:13000", "13000".',
                default: '/run/netlocked.sock',
                string: true,
            })
            .option('tls', {
                group: 'Networking',
                desc: 'Use TLS.',
                default: false,
                boolean: true
            })
            .option('tls-key', {
                group: 'Networking',
                desc: 'Path to TLS key filename.',
                default: def.tlsKey,
                normalize: true,
            })
            .option('tls-cert', {
                group: 'Networking',
                desc: 'Path to TLS cert filename.',
                default: def.tlsCert,
                normalize: true,
            })
            .help()
            .argv;
        if (this.config.tlsKey !== def.tlsKey || this.config.tlsCert !== def.tlsCert) {
            this.config.tls = true;
        }
    }
}

module.exports = Server;
