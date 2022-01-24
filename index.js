const express = require('express');
const bodyParser = require('body-parser');
const Request = require('request');
const Path = require('path');
const Blockchain = require('./blockchain');
const Pubsub = require('./app/pubsub');
const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet');
const request = require('request');
const TransactionMiner = require('./app/transaction-miner');

const isDevelopment = process.env.ENV === 'development';

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new Pubsub({ blockchain, transactionPool, wallet });
const transactionMiner = new TransactionMiner({ blockchain, transactionPool, wallet, pubsub });

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = isDevelopment ?
 `http://localhost:${DEFAULT_PORT}`:
 'https://crypto-chain613.herokuapp.com';

setTimeout(() => { pubsub.broadcastChain() }, 1000);

app.use(bodyParser.json());
app.use(express.static(Path.join(__dirname, "client/dist")));

app.get('/api/blocks', (req, res) => {
    res.json(blockchain.chain);
});

app.post('/api/mine', (req, res) => {
    const { data } = req.body;
 
    blockchain.addBlock({ data });
    pubsub.broadcastChain();

    res.redirect('/api/blocks');
});

app.post('/api/transact', (req, res) => {
    const { amount, recipient } = req.body;
    let transaction = transactionPool.existingTransaction({ inputAddress: wallet.publicKey });
    try{
        if(transaction){
            transaction.update({ senderWallet: wallet, recipient, amount });
        } else {
            transaction = wallet.createTransaction({ recipient, amount, chain: blockchain.chain });
        }

    } catch(error){
        return res.status(400).json({type: 'error', message: error.message});
    }

    transactionPool.setTransaction(transaction);
    pubsub.broadcastTransaction(transaction);

    res.json({ type: 'success', transaction });
});

app.get('/api/transaction-pool-map', (req, res) => {
    res.json(transactionPool.transactionMap);
});

app.get('/api/mine-transactions', (req, res) => {
    transactionMiner.mineTransactions();
    
    res.redirect('/api/blocks');
});

app.get('/api/wallet-info', (req, res) => {
    const address = wallet.publicKey;
    res.json({
        address,
        balance: Wallet.calculateBalance({ chain: blockchain.chain, address}),
    });
});

app.get('*', (req, res)=>{
    res.sendFile(Path.join(__dirname, 'client/dist/index.html'));    
});

const syncWithRoot = () => {
    Request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const rootChain = JSON.parse(body);
            console.log('replace chain on syncing', rootChain);
            blockchain.replaceChain(rootChain);

        }
    });

    request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` }, (e, response, body) => {
        if(!e && response.statusCode === 200){
            const rootTransactionPool = JSON.parse(body);
            console.log('replace transaction pool map on sync with', rootTransactionPool);
            transactionPool.setMap(rootTransactionPool);
        }
    });
};

let PEER_PORT;

if (process.env.GENERATE_PEER_PORT === 'true') {
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}
const PORT = process.env.PORT || PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
    if (PORT !== DEFAULT_PORT) {
        syncWithRoot();
    }
});