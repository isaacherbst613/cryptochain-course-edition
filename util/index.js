const EC = require ('elliptic').ec;
const cryptoHash = require('../util/crypto-hash');

const ec = new EC('secp256k1');

const verifySignature = ({ publicKey, data, signature }) => {
    const keyfromPublic = ec.keyFromPublic(publicKey, 'hex');
    return keyfromPublic.verify(cryptoHash(data), signature);
};

module.exports = {ec, verifySignature, cryptoHash};