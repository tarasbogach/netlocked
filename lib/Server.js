const fs = require('fs');
const net = require('net');
const tls = require('tls');
const yargs = require('yargs');

class Server {
    constructor(){
        this.initArgs();
        this.initNet();
        (async ()=>{
            await this.listen();
        })().catch((error)=>{
            console.error(error);
            process.exit();
        });
    }

    async listen(){
        let all = [];
        for(let listen of this.args.listen){
            // console.group('Listen');
            all.push(
                new Promise((resolve, reject)=>{
                    console.info(`Try to listen on '${listen}'.`)
                    switch(true){
                        case listen.match(/\//):
                            this.net.listen(listen, (error)=>{
                                if(error){
                                    reject([listen, error]);
                                }else{
                                    resolve(listen);
                                }
                            });
                            break;
                        case listen.match(/^[^:]+:[0-9]+$/):
                            let [host, port] = listen.split(':');
                            this.net.listen(parseInt(port), host, (error)=>{
                                if(error){
                                    reject([listen, error]);
                                }else{
                                    resolve(listen);
                                }
                            });
                            break;
                        case listen.match(/^[0-9]+$/):
                            this.net.listen(parseInt(listen), (error)=>{
                                if(error){
                                    reject([listen, error]);
                                }else{
                                    resolve(listen);
                                }
                            });
                            break;
                        default:
                            reject(listen, 'Unknown listen type.');
                            break;
                    }
                })
                .then((listen)=>{
                    console.info(`Listen on ${listen}.`);
                    return Promise.resolve(true);
                })
                .catch(([listen, error])=>{
                    console.error(`Can not listen on ${listen}.`);
                    return Promise.reject(error);
                })
            )
        }
        await Promise.all(all);
        // console.groupEnd();
    }

    initNet(){
        if(this.args.tls === true){
            this.net = tls.createServer();
        }else{
            this.net = net.createServer();
        }
        this.net.on('connection', (socket)=>{
            console.log(socket);
        })
    }

    initArgs(){
        this.args = yargs
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
        if(this.args.tlsKey !== '/var/lib/netlocked/key.pem' || this.args.tlsCert !== '/var/lib/netlocked/cert.pem'){
            this.args.tls = true;
        }
    }
}

module.exports = Server;
