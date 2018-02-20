let EventEmiter = require('events');
class SocketWrapper extends EventEmiter{
    static makeId(){
        if(!this.id){
            this.id = 0;
        }
        return this.id++;
    }
    constructor(netSocket){
        super();
        this.id = this.constructor.makeId();
        console.log(this.id);
        this.netSocket = netSocket;
    }
}
module.exports = SocketWrapper;
