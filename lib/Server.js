const fs = require('fs');
const net = require('net');
const tls = require('tls');
const yargs = require('yargs');

class Server {
    constructor(){
        this.initConfig();
        this.initNet();
        (async ()=>{
            await this.listen();
            process.on('SIGINT', ()=>{
                this.exit();
            })
        })().catch((error)=>{
            console.error(error);
            process.exit();
        });
    }

    exit(){
        this.net.close();
    }

    listen(){
        return new Promise((resolve, reject)=>{
            let listen = this.config.listen;
            console.info(`Try to listen on '${listen}'.`)
            let callback = (error)=>{
                if(error){
                    console.error(error);
                    reject();
                }else{
                    console.info(`Listening on '${listen}'.`);
                    resolve();
                }
            };
            switch(true){
                case !!listen.match(/\//):
                    fs.access(listen, (none) => {
                        if(none){
                            this.net.listen(listen, callback);
                        }else{
                            fs.unlink(listen,(error) => {
                                if(error){
                                    reject(error);
                                }else{
                                    this.net.listen(listen, callback);
                                }
                            })
                        }
                    });
                    break;
                case !!listen.match(/^.*:[0-9]+$/):
                    let parse = listen.split(':');
                    let port = parse.pop();
                    let host = parse.join(':');
                    this.net.listen(port, host, callback);
                    break;
                case !!listen.match(/^[0-9]+$/):
                    this.net.listen(listen, callback);
                    break;
                default:
                    callback('Unknown listen type');
                    break;
            }
        })
    }

    initNet(){
        if(this.config.tls === true){
            this.net = tls.createServer({
                key: this.config.tlsKey,
                cert: this.config.tlsCert,
            });
        }else{
            this.net = net.createServer();
        }
        this.net.on('connection', (socket)=>{
            console.log(socket);
        })
    }

    initConfig(){
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
                default: '/var/lib/netlocked/key.pem',
                normalize: true,
            })
            .option('tls-cert', {
                group: 'Networking',
                desc: 'Path to TLS cert filename.',
                default: '/var/lib/netlocked/cert.pem',
                normalize: true,
            })
            .help()
            .argv;
        if(this.config.tlsKey !== '/var/lib/netlocked/key.pem' || this.config.tlsCert !== '/var/lib/netlocked/cert.pem'){
            this.config.tls = true;
        }
    }
}

module.exports = Server;
