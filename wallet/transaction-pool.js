const Transaction = require('./transaction');

class TransactionPool{
    constructor(){
        this.transactionMap = {};
    }

    setTransaction(transaction){
        this.transactionMap[transaction.id] = transaction;
    }

    existingTransaction({inputAddress}) {
        const transactions = Object.values(this.transactionMap);

        return transactions.find(transaction => transaction.input.address === inputAddress);
    }

    setMap(transactionPoolMap){
        this.transactionMap = transactionPoolMap;
    }

    validTransactions(){
        return Object.values(this.transactionMap).filter(
            transaction => Transaction.validTransaction(transaction)
          );
    }

    clear(){
        this.transactionMap = {};
    }

    clearBlockchainTransactions({chain}){
        chain.forEach(block => {
            block.data.forEach(transaction => {
                delete this.transactionMap[transaction.id];
            });
        });

    };
}

module.exports = TransactionPool;