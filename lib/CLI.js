const repl = require('repl');
const Client = require('./Client.js');
const UUID = require('./UUID.js');
class CLI {
    constructor(){
        let server = repl.start();
        server.context.UUID = UUID;
        server.context.netlocked = new Client();
        server.context.$ = new Client();
    }
}

module.exports = CLI;
