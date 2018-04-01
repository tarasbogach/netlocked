class Vhost {

    constructor(name){
        this.name = name;
        this.lock = new Map();
        this.semaphore = new Map();
        this.circle = new Map();
    }

}
module.exports = Vhost;
