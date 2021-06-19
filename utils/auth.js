const bcrypt = require('bcryptjs')

function hashPassword(plaintext) {
    return bcrypt.hashSync(plaintext, 5)
}

function compareHash(plaintext, hash) {
    return bcrypt.compareSync(plaintext, hash)
}

module.exports = {
    hashPassword,
    compareHash,
}
