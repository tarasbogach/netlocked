const EventEmiter = require('events');
class Semaphore extends EventEmiter {

    //TODO multiple lock by same lockerId
    constructor(key, size = 1){
        super();
        this.key = key;
        this.size = size;
        this.locker = new Set();
        this.waiter = new Map();
    }

    isEmpty(){
        return 0 === this.locker.size && 0 === this.waiter.size;
    }

    lock(lockerId, wait = true, timeout = false){
        if(this.locker.size < this.size || this.locker.has(lockerId)){
            this.locker.add(lockerId);
            this.emit('locked', this.key, lockerId, this.locker.size, this.waiter.size);
            return Promise.resolve(true);
        }else if(true === wait){
            if(this.waiter.has(lockerId)){
                return this.waiter.get(lockerId)[0];
            }else{
                let waiter = new Array(4);
                waiter[0] = new Promise((fulfill, reject)=>{
                    waiter[1] = fulfill;
                    waiter[2] = reject;
                    if(timeout !== false){
                        waiter[3] = setTimeout(()=>{
                            this.waiter.delete(lockerId);
                            this.emit('canceled', this.key, lockerId, this.locker.size, this.waiter.size);
                            reject();
                        }, timeout);
                    }
                });
                this.waiter.set(lockerId, waiter);
                this.emit('awaited', this.key, lockerId, this.locker.size, this.waiter.size);
                return waiter[0];
            }
        }else{
            return Promise.resolve(false);
        }
    }

    cancel(lockerId){
        if(this.waiter.has(lockerId)){
            let [, , reject, timeout] = this.waiter.get(lockerId);
            if(timeout){
                clearTimeout(timeout);
            }
            this.waiter.delete(lockerId);
            this.emit('canceled', this.key, lockerId, this.locker.size, this.waiter.size);
            reject();
        }
    }

    unlock(lockerId){
        if(this.locker.has(lockerId)){
            this.locker.delete(lockerId);
            this.emit('unlocked', this.key, lockerId, this.locker.size, this.waiter.size);
        }
        if(this.waiter.has(lockerId)){
            this.waiter.delete(lockerId);
            this.emit('canceled', this.key, lockerId, this.locker.size, this.waiter.size);
        }
        if(this.locker.size < this.size && this.waiter.size > 0){
            let [waiterId, [, fulfill, , timeout]] = this.waiter.entries().next().value;
            if(timeout){
                clearTimeout(timeout);
            }
            this.waiter.delete(waiterId);
            this.locker.add(waiterId);
            this.emit('locked', this.key, waiterId, this.locker.size, this.waiter.size);
            fulfill();
        }
    }

}

module.exports = Semaphore;
