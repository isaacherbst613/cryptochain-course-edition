const PubNub = require('pubnub');

const creds = {
    publishKey: "pub-c-36616826-00b5-4953-9448-5d0f91b16664",
    subscribeKey: "sub-c-e19d2e74-64d6-11ec-a849-9ab6f3dc7df6",
    secretKey: "sec-c-OGQwZDQzMjUtMDFiMS00Nzc5LWJiNDAtNTQwZTY5NDFlOGYw",
}

const CHANNELS = {
    TEST: 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN',
    TRANSACTION: 'TRANSACTION'
}

class PubSub {
    constructor({ blockchain, transactionPool, wallet }) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;
        this.pubnub = new PubNub(creds);
        this.pubnub.addListener(this.listener());
        this.pubnub.subscribe({ channels: Object.values(CHANNELS) });
        
    }

    listener() {
        return {
            message: messageObject => {
                const { channel, message } = messageObject;
                console.log(`Message received. Channel: ${channel}. Message: ${message}`);
                const parsedMessage = JSON.parse(message);

                switch (channel) {
                    case CHANNELS.BLOCKCHAIN:
                        this.blockchain.replaceChain(parsedMessage, true, ()=>{
                            this.transactionPool.clearBlockchainTransactions({chain: parsedMessage});
                        });
                        break;
                    case CHANNELS.TRANSACTION:
                        if(/* parsedMessage.input.address !== this.wallet.publicKey */!this.transactionPool.existingTransaction({
                            inputAddress: this.wallet.publicKey})){
                            this.transactionPool.setTransaction(parsedMessage);
                        }
                        break;
                        default:
                            return;
                }
            }
        }
    }

    subscribeToChannels() {
        this.pubnub.subscribe({
            channels: [Object.values(CHANNELS)]
        });
    }

    publish({ channel, message }) {
        this.pubnub.publish({ channel, message });
    }

    broadcastChain() {
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            message: JSON.stringify(this.blockchain.chain)
        });
    }

    broadcastTransaction(transaction) {
        this.publish({
            channel: CHANNELS.TRANSACTION,
            message: JSON.stringify(transaction)
        });
    };
}


module.exports = PubSub;