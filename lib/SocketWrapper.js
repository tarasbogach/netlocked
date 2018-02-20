const EventEmiter = require('events');
const {StringDecoder} = require('string_decoder');

/**
 * @fires SocketWrapper#message
 * @fires SocketWrapper#end
 */
class SocketWrapper extends EventEmiter {

    constructor(socket) {
        super();
        this._id = this.constructor.makeId();
        this._decoder = new StringDecoder('utf8');
        this._buffer = '';
        this._socket = socket;
        this._onData = (chunk) => {
            this._buffer += this._decoder.write(chunk);
            let start = 0, end;
            while ((end = this._buffer.indexOf("\n")) > -1) {
                let message = this._buffer.slice(start, end);
                this._buffer = this._buffer.slice(end + 1);
                /**
                 * @event SocketWrapper#message
                 */
                this.emit('message', JSON.parse(message));
            }
        };
        this.socket.on('data', this._onData);
        this.socket.once('end', () => {
            /**
             * @event SocketWrapper#end
             * @type {Object}
             * @property {String} uuid
             */
            this.emit('end');
            this._socket.removeListener('data', this._onData);
            this._socket = null;
            this._decoder = null;
        });
    }

}

module.exports = SocketWrapper;
