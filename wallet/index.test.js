const Wallet = require('./index');
const { verifySignature } = require('../util');
const Transaction = require('./transaction');
const Blockchain = require('../blockchain');
const { STARTING_BALANCE } = require('../config');;

describe('Wallet', () => {
    let wallet;

    beforeEach(() => {
        wallet = new Wallet();
    });

    it('has a `balance`', () => {
        expect(wallet).toHaveProperty('balance');
    });

    it('has a `publicKey`', () => {
        expect(wallet).toHaveProperty('publicKey');
    });

    describe('signing data', () => {
        const data = 'foo';
        it('verifies a signature', () => {
            expect(
                verifySignature({
                    publicKey: wallet.publicKey,
                    data,
                    signature: wallet.sign(data)
                })
            ).toBe(true);
        });
        it("doen't verify an invalid signature", () => {
            expect(
                verifySignature({
                    publicKey: wallet.publicKey,
                    data,
                    signature: new Wallet().sign(data)
                })
            ).toBe(false);
        });
    });

    describe('createTransaction()', () => {
        describe('amount exceeds the balance', () => {
            it('throws an error', () => {
                expect(() => wallet.createTransaction({ amount: 999999999, recipient: 'faker' })).toThrow('Invalid amount');
            });
        });

        describe('amount is valid', () => {
            let transaction, amount, recipient;

            beforeEach(() => {
                amount = 50;
                recipient = 'faker';
                transaction = wallet.createTransaction({ amount, recipient });
            });
            it('creates a `Transaction`', () => {
                expect(transaction instanceof Transaction).toBe(true);
            });

            it('matches the transaction input with the wallet', () => {
                expect(transaction.input.address).toEqual(wallet.publicKey);
            });

            it('outputs the amount to the recipient', () => {
                expect(transaction.outputMap[recipient]).toEqual(amount);
            })

        });

        describe('and a chain is passed', ()=>{
            it('calls `Wallet.calculateBalance()',()=>{
                const calBalMock = jest.fn();
                const originalCalBal = Wallet.calculateBalance;
                Wallet.calculateBalance = calBalMock;

                wallet.createTransaction({
                    recipient: 'foo',
                    amount: 10,
                    chain: new Blockchain().chain  
                });

                expect(calBalMock).toHaveBeenCalled();
                Wallet.calculateBalance = originalCalBal;
            });
        });
    });

    describe('calculateBalance()', () => {
        let blockchain;
        beforeEach(() => {
            blockchain = new Blockchain();
        });

        describe('and there are no outputs for the wallet', () => {
            it('returns the `STARTING_BALANCE`', () => {
                expect(Wallet.calculateBalance({ chain: blockchain.chain, address: wallet.publicKey })).toEqual(STARTING_BALANCE);
            });
        });

        describe('and there are outputs for the wallet', () => {
            let transactionOne, transactionTwo;
            beforeEach(() => {
                transactionOne = new Wallet().createTransaction({
                    recipient: wallet.publicKey,
                    amount: 50
                });

                transactionTwo = new Wallet().createTransaction({
                    recipient: wallet.publicKey,
                    amount: 100
                });

                blockchain.addBlock({ data: [transactionOne, transactionTwo] });
            });

            it('adds the sum of all outputs to the wallet balance', () => {
                expect(
                    Wallet.calculateBalance({
                        chain: blockchain.chain,
                        address: wallet.publicKey
                    })
                ).toEqual(
                    STARTING_BALANCE +
                    transactionOne.outputMap[wallet.publicKey] +
                    transactionTwo.outputMap[wallet.publicKey]
                    );
            });
        });

        describe('and the wallet has made a transaction', ()=>{
            let recentTrans;

            beforeEach(()=>{
                recentTrans = wallet.createTransaction({
                    recipient: 'foo',
                    amount: 30
                });

                blockchain.addBlock({data: [recentTrans]});
            });

            it('returns the output amount of the recent transaction', ()=>{
                expect(
                    Wallet.calculateBalance({
                        chain: blockchain.chain,
                        address: wallet.publicKey
                    })
                ).toEqual(recentTrans.outputMap[wallet.publicKey]);
            });

            describe('and there are outputs next to and after the recent transaction', ()=>{
                let sameBlockTrans, nextBlockTrans;

                beforeEach(()=>{
                    recentTrans = wallet.createTransaction({
                        recipient: 'foo2',
                        amount: 60
                    });

                    sameBlockTrans = Transaction.rewardTransaction({ minerWallet: wallet });

                    blockchain.addBlock({data: [recentTrans, sameBlockTrans]});
                    
                    nextBlockTrans = new Wallet().createTransaction({
                        recipient: wallet.publicKey,
                        amount: 100
                    });

                    blockchain.addBlock({data: [nextBlockTrans]});
                });

                it('includes the output amount of recent and same-block transaction', ()=>{
                    expect(
                        Wallet.calculateBalance({
                            chain: blockchain.chain,
                            address: wallet.publicKey
                        })
                    ).toEqual(
                        recentTrans.outputMap[wallet.publicKey] +
                        sameBlockTrans.outputMap[wallet.publicKey] +
                        nextBlockTrans.outputMap[wallet.publicKey]
                    );
                });
            });
        });
    });
});
