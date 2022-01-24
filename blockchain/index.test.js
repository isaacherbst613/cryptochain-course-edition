const Blockchain = require('./index');
const Block = require('./block');
const {cryptoHash} = require('../util');
const Wallet = require('../wallet');
const Transaction = require('../wallet/transaction')

describe('Blockchain', () => {
    let blockchain, newChain, originalChain, errorMock;

    beforeEach(() => {
        blockchain = new Blockchain();
        newChain = new Blockchain();
        errorMock = jest.fn();

        originalChain = blockchain.chain;
        global.console.error = errorMock;
    });

    it('contains a `chain` Array instance', () => {
        expect(blockchain.chain instanceof Array).toBe(true);
    });

    it('starts with genesis block', () => {
        expect(blockchain.chain[0]).toEqual(Block.genesis());
    });

    it('adds a new block to the chain', () => {
        const newData = "foo ";
        blockchain.addBlock({ data: newData });

        expect(blockchain.chain[blockchain.chain.length - 1].data).toEqual(newData);
    });

    describe('isValidChain', () => {
        describe('when the chain does not start with the genesis', () => {
            it('returns false', () => {
                blockchain.chain[0] = { data: 'fake-genesis' };

                expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
            });
        })

        describe('when the chain starts with the genesis and has multiple blocks', () => {

            beforeEach(() => {
                blockchain.addBlock({ data: 'foo' });
                blockchain.addBlock({ data: 'bar' });
                blockchain.addBlock({ data: 'baz' });

            });
            describe('and a lastHash reference has changed', () => {
                it('returns false', () => {
                    blockchain.chain[2].lastHash = 'broken-lastHash';

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('and the chain contains a block with an invalid field', () => {
                it('returns false', () => {
                    blockchain.chain[2].data = 'bad-data';

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('and the chain contains a block with a jumped difficulty', ()=>{
                it('returns false', ()=>{
                    const lastBlock = blockchain.chain[blockchain.chain.length-1];
                    const lastHash = lastBlock.hash;
                    const timestamp = Date.now();
                    const nonce = 0;
                    const data = [];
                    const difficulty = lastBlock.difficulty -3;
                    const hash = cryptoHash(timestamp, lastHash, difficulty, nonce, data);
                    const badBlock = new Block({timestamp, lastHash, nonce, difficulty, hash, data});

                    blockchain.chain.push(badBlock);

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('and the chain contains only valid blocks', () => {
                it('returns true', () => {

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);

                });
            });
        });
    });

    describe('replaceChain', () => {
        let logMock;
        beforeEach(()=>{
            logMock = jest.fn();
            global.console.log = logMock;
        }); 
        describe('when new chain is not longer', ()=>{
            beforeEach(()=>{
                newChain.chain[0] = {new: 'chain'};
                blockchain.replaceChain(newChain.chain);
            })
            it('it does not replace the chain', ()=>{      
                expect(blockchain.chain).toEqual(originalChain);
            });
            it('logs an error', ()=>{
                expect(errorMock).toHaveBeenCalled();
            });
        });
        describe('when new chain is longer', ()=>{
            beforeEach(()=>{
                newChain.addBlock({ data: 'foo' });
                newChain.addBlock({ data: 'bar' });
                newChain.addBlock({ data: 'baz' });
            });
            describe('and it is invalid', ()=>{
                beforeEach(()=>{
                    newChain.chain[2].hash = 'some-fake-hash';
                    blockchain.replaceChain(newChain.chain);
                });
                it('it does not replace the chain', ()=>{
                    expect(blockchain.chain).toEqual(originalChain);
                });
                it('logs an error', ()=>{
                    expect(errorMock).toHaveBeenCalled();
                });
            });
            describe('and it is valid', ()=>{
                beforeEach(()=>{
                    blockchain.replaceChain(newChain.chain);
                })
                it('it replaces the chain', ()=>{
                    expect(blockchain.chain).toEqual(newChain.chain);
                });
                it('logs about the chain replacement', ()=>{
                    expect(logMock).toHaveBeenCalled();
                });
            });
        });

        describe('and the `validateTransaction` flag is true', ()=>{
            it('calls validTransactionData()', ()=>{
                const validTransactionDataMock = jest.fn();
                blockchain.validTransactionData = validTransactionDataMock;

                newChain.addBlock({data: 'test'});
                blockchain.replaceChain(newChain.chain, true);

                expect(validTransactionDataMock).toHaveBeenCalled();

            });
        });
    });

    describe('validTransactionData', ()=>{
        let transaction, rewardTransaction, wallet;

        beforeEach(()=>{
            wallet = new Wallet();
            transaction = wallet.createTransaction({ recipient: 'foo-recipient', amount: 65 });
            rewardTransaction = Transaction.rewardTransaction({ minerWallet: wallet });
        });

        describe('and the transaction is valid', ()=>{
            it('returns true', ()=>{
                newChain.addBlock({data: [transaction, rewardTransaction]});
                expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(true);
            });
        });

        describe('and the transaction data has mutible awards', ()=>{
            it('returns false and logs an error', ()=>{
                newChain.addBlock({data: [transaction, rewardTransaction, rewardTransaction]});
                expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
                expect(errorMock).toHaveBeenCalled();
            });
        });

        describe('and the transaction data has at least one malformed outputMap',()=>{
            describe('while not a reward transaction', ()=>{
                it('returns false and logs an error', ()=>{
                    transaction.outputMap[wallet.publicKey] = 999999;
                    newChain.addBlock({data: [transaction, rewardTransaction]});

                    expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
            describe('while a reward transaction', ()=>{
                it('returns false and logs an error', ()=>{
                    rewardTransaction.outputMap[wallet.publicKey] = 999999;
                    newChain.addBlock({data: [transaction, rewardTransaction]});
                    
                    expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
        });

        describe('and the transaction data has at least one malformed input', ()=>{
            it('returns false and logs an error', ()=>{
                wallet.balance = 9000;
                const badOutputMap = {
                    [wallet.publicKey]: 8900,
                    fooRecipient: 100
                }
                const badTrans = {
                    input:{
                        timestamp: Date.now(),
                        amount: wallet.balance,
                        address: wallet.publicKey,
                        signature: wallet.sign(badOutputMap)
                    },
                    outputMap: badOutputMap
                }

                newChain.addBlock({data: [badTrans, rewardTransaction]});
                expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
                expect(errorMock).toHaveBeenCalled();
            });

        });
        describe('has multible identicle transactions', ()=>{
            it('returns false and logs an error', ()=>{
                newChain.addBlock({ data: [transaction ,transaction, rewardTransaction]});
                
                expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
                expect(errorMock).toHaveBeenCalled();
            });

           
        })
    });

});