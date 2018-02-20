const crypto = require('crypto');

class UUID {

    /**
     * @returns {Buffer}
     */
    static toBuffer() {
        let buffer = crypto.randomBytes(16);
        buffer[6] = (buffer[6] & 0x0f) | 0x40;
        buffer[8] = (buffer[8] & 0x3f) | 0x80;
        return buffer;
    }

    /**
     * @returns {String}
     */
    static toUUID() {
        let hex = this.toHex();
        let uuid = '';
        let index = 0;
        for (let char of hex) {
            uuid += char;
            index++;
            if (index === 8 || index === 12 || index === 16 || index === 20) {
                uuid += '-';
            }
        }
        return uuid;
    }

    /**
     * @returns {String}
     */
    static toHex() {
        return this.toBuffer().toString('hex');
    }

    /**
     * @returns {String}
     */
    static toBase64() {
        let base64 = this.toBuffer().toString('base64');
        let end = base64.indexOf('=');
        if(end > -1){
            base64 = base64.slice(0, end);
        }
        return base64;
    }

    /**
     * @returns {String}
     */
    static toBase64Url() {
        let base64 = this.toBase64();
        let base64url = '';
        for (let char of base64) {
            switch (char) {
                case '+':
                    base64url += '-';
                    break;
                case '/':
                    base64url += '_';
                    break;
                // case '=':
                //     break;
                default:
                    base64url += char;
            }
        }
        return base64url;
    }

    /**
     *
     * @param {String} base64url
     * @returns {Buffer}
     */
    static fromBase64Url(base64url){
        return this.fromBase64(base64url);
    }

    /**
     *
     * @param {String} base64
     * @returns {Buffer}
     */
    static fromBase64(base64){
        return new Buffer(base64, 'base64');
    }

    /**
     *
     * @param {String} hex
     * @returns {Buffer}
     */
    static fromHex(hex){
        return new Buffer(hex, 'hex');
    }

    /**
     *
     * @param {String} uuid
     * @returns {Buffer}
     */
    static fromUUID(uuid){
        return this.fromHex(uuid.replace(/-/g, ''));
    }
}

module.exports = UUID;
