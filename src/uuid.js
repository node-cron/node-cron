const crypto = require('crypto');

function generateUUID() {

    const buffer = crypto.randomBytes(16);

    const hex = buffer.toString('hex');

    const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;

    return uuid;
}

module.exports = generateUUID;
