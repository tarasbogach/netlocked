const UUID = require('./UUID.js');

class Message {

    constructor() {
        this.id = null;
        this.command = null;
        this.data = null;
    }

    static fromJSON(json){
        try {
            return new Message(JSON.parse(json));
        }catch(error){
            return false;
        }
    }

    /**
     *
     * @param {String} id
     * @return {Message}
     */
    setId(id) {
        this.id = id;
        return this;
    }

    /**
     *
     * @returns {String}
     */
    getId() {
        return this.id;
    }
    /**
     *
     * @param {String} command
     * @return {Message}
     */
    setCommand(command) {
        this.command = command;
        return this;
    }

    /**
     *
     * @returns {String}
     */
    getCommand() {
        return this.command;
    }

    /**
     *
     * @param {Object} data
     * @return {Message}
     */
    setData(data) {
        this.data = data;
        return this;
    }

    /**
     *
     * @returns {Object}
     */
    getData() {
        return this.data;
    }

    /**
     *
     * @returns {String}
     */
    toJSON(){
        return JSON.stringify({
            id: this.id,
            command: this.command,
            data: this.data,
        });
    }

}

module.exports = Message;
