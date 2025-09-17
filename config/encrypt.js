const bcrypt = require('bcrypt')
const encrypt = {};

encrypt.Hash = function (textPassword) {
    let saltRounds = 12
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(textPassword, salt);
    return hash;
}

encrypt.Check = function (textPassword, hash) {
    let feedback = bcrypt.compareSync(textPassword, hash);
    return feedback;
}

module.exports = encrypt;