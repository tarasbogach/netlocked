const EventEmiter = require('events');
const {StringDecoder} = require('string_decoder');

/**
 * @fires SocketWrapper#message
 * @fires SocketWrapper#end
 */
class SocketWrapper extends EventEmiter {

    constructor(socket) {
        super();
        this.id = this.constructor.makeId();
        this.decoder = new StringDecoder('utf8');
        this.buffer = '';
        this.socket = socket;
        this.onData = (chunk) => {
            this.buffer += this.decoder.write(chunk);
            let start = 0, end;
            while ((end = this.buffer.indexOf("\n")) > -1) {
                let message = this.buffer.slice(start, end);
                this.buffer = this.buffer.slice(end + 1);
                /**
                 * @event SocketWrapper#message
                 */
                this.emit('message', JSON.parse(message));
            }
        };
        this.socket.on('data', this.onData);
        this.socket.once('end', () => {
            /**
             * @event SocketWrapper#end
             * @type {Object}
             * @property {String} uuid
             */
            this.emit('end');
            this.socket.removeListener('data', this.onData);
            this.socket = null;
            this.decoder = null;
        });
    }

}

module.exports = SocketWrapper;
