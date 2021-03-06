const { v1: uuid } = require('uuid');
const { REWARD_INPUT, MINING_REWARD } = require('../config');
const { verifySignature } = require('../util');

class Transaction {
    constructor({ senderWallet, recipient, amount, outputMap, input }) {
        this.id = uuid();
        this.outputMap = outputMap || {
            [recipient]: amount,
            [senderWallet.publicKey]: senderWallet.balance - amount
        };
        this.input = input || this.createInput({ senderWallet, outputMap: this.outputMap });

    }

    createInput({ senderWallet, outputMap }) {
        return {
            timestamp: Date.now(),
            amount: senderWallet.balance,
            address: senderWallet.publicKey,
            signature: senderWallet.sign(outputMap)
        }
    }

    static validTransaction(transaction) {
        const { input: { address, amount, signature }, outputMap } = transaction;
        const outputTotal = Object.values(outputMap)
            .reduce((total, outputAmount) => total + outputAmount);
            
        if (amount !== outputTotal) {
            console.error(`Invalid transaction from ${address}`);
            return false;
        }
        if(!verifySignature({publicKey: address, data: outputMap, signature})){
            console.error(`Invalid signature from ${address}`);
            return false;
        }
        return true;
    }

    update({ senderWallet, recipient, amount }){
        if(amount > this.outputMap[senderWallet.publicKey] || amount < 0){
            throw new Error('Invalid amount');
        }

        if(!this.outputMap[recipient]){
            this.outputMap[recipient] = amount;
        } else {
            this.outputMap[recipient] = this.outputMap[recipient] + amount;
        }
        this.outputMap[senderWallet.publicKey] = this.outputMap[senderWallet.publicKey] - amount;
        
        this.input = this.createInput({ senderWallet, outputMap: this.outputMap})
    }

    static rewardTransaction({minerWallet}){
        return new this({
            input: REWARD_INPUT,
            outputMap: {[minerWallet.publicKey] : MINING_REWARD}
        });
    }
}

module.exports = Transaction;