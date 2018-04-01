const EventEmitter = require('events');
const Message = require('./Message.js');
const {StringDecoder} = require('string_decoder');

/**
 * @fires Socket#message
 * @fires Socket#end
 */
class Socket extends EventEmitter {

    constructor(socket, id) {
        super();
        this.id = id;
        this.setSocket(socket);
        this.username = null;
        this.vhost = null;
        this.credentials = new Set();
    }

    setSocket(socket){
        this.socket = socket;
        let buffer = '';
        let decoder = new StringDecoder('utf8');
        let onData = (chunk)=>{
            buffer += decoder.write(chunk);
            let start = 0, end;
            while ((end = buffer.indexOf("\n")) > -1) {
                let message = buffer.slice(start, end);
                buffer = buffer.slice(end + 1);
                /**
                 * @event Socket#message
                 * @type {Message}
                 */
                this.emit('message', Message.fromJSON(message));
            }
        };
        let onEnd = () => {
            this.socket.removeListener('data', onData);
            this.socket = null;
            /**
             * @event Socket#end
             */
            this.emit('end');
        };
        this.socket.on('data', onData);
        this.socket.once('end', onEnd);
        return this;
    }

    /**
     *
     * @param {Message} message
     * @returns {Promise}
     */
    send(message){
        return new Promise((resolve, reject) => {
            this.socket.write(message.toJSON()+"\n", () => {
                resolve();
            });
        });
    }

    getId(){
        return this.id;
    }

    setId(id){
        this.id = id;
        return this;
    }

    getVhost(){
        return this.vhost;
    }

    setVhost(value){
        this.vhost = value;
        return this;
    }

    getUsername(){
        return this.username;
    }

    setUsername(value){
        this.username = value;
        return this;
    }

    /**
     *
     * @returns {Set<String>}
     */
    getCredentials(){
        return this.credentials;
    }

    /**
     *
     * @param {String} value
     * @returns {boolean}
     */
    hasCredential(value){
        return this.context.credentials.has(value);
    }

    /**
     *
     * @param {String} value
     */
    addCredential(value){
        this.credentials.add(value);
        return this;
    }

    /**
     *
     * @param {Array<String>} value
     */
    setCredentials(value){
        this.credentials = new Set(value);
        return this;
    }

}

module.exports = Socket;
