const Block = require('./block');
const {cryptoHash} = require('../util');
const { GENESIS_DATA, MINE_RATE } = require('../config');
const hexToBinary = require('hex-to-binary');

describe('Block', () => {
    const timestamp = 2000;
    const lastHash = 'foo-hash';
    const hash = 'bar-hash';
    const data = ['blockchain', 'data'];
    const nonce = 1;
    const difficulty = 1;  
    const block = new Block({timestamp, lastHash, hash, data, nonce, difficulty});


    it('has a timestamp, lasthash, hash, and data props', ()=>{
        expect(block.timestamp).toEqual(timestamp);
        expect(block.lastHash).toEqual(lastHash);
        expect(block.hash).toEqual(hash);
        expect(block.data).toEqual(data);
        expect(block.nonce).toEqual(nonce);
        expect(block.difficulty).toEqual(difficulty);
    })

    describe('genesis()', ()=>{
        const genesisBlock = Block.genesis();

        it('returns a block inst', ()=>{
            expect(genesisBlock instanceof Block).toBe(true);
        });
        it('returns genesis data', ()=>{
            expect(genesisBlock).toEqual(GENESIS_DATA);
        });
    });

    describe('mineblock()', ()=>{
        const lastBlock = Block.genesis();
        const data = 'mined data';
        const minedblock = Block.mineBlock({lastBlock, data});

        it('returns a block inst', ()=>{
            expect(minedblock instanceof Block).toBe(true);
        });

        it('sets the `lastHash` to be the `hash` of the lastBlock', ()=>{
            expect(minedblock.lastHash).toEqual(lastBlock.hash);
        });

        it('sets the `data`', ()=>{
            expect(minedblock.data).toEqual(data);
        });

        it('sets a `timestamp`', ()=>{
            expect(minedblock.timestamp).not.toEqual(undefined);
        });

        it('creates a SHA-256 `hash` based on proper inputs', ()=>{
            expect(minedblock.hash)
                .toEqual(
                    cryptoHash(
                        minedblock.timestamp,
                        minedblock.nonce,
                        minedblock.difficulty,
                        lastBlock.hash,
                        data
                    )
                );
        });

        it('sets a `hash` that matches the diffuculty criteria', () =>{
            expect(hexToBinary(minedblock.hash).substring(0, minedblock.difficulty))
            .toEqual('0'.repeat(minedblock.difficulty));
        });

        it('adjusts the difficulty', ()=>{
            const possibleResults = [lastBlock.difficulty -1, lastBlock.difficulty +1];

            expect(possibleResults.includes(minedblock.difficulty)).toBe(true);
        })
    });

    describe('adjustDifficulty()', ()=>{
        it('raises the difficulty for a quickly mined block', ()=>{
            expect(Block.adjustDifficulty({
                originalBlock: block,
                timestamp : block.timestamp + MINE_RATE -100
            })).toEqual(block.difficulty+1);
        });
        it('lowers the difficulty for a slowly mined block', ()=>{
            expect(Block.adjustDifficulty({
                originalBlock: block,
                timestamp : block.timestamp + MINE_RATE + 100
            })).toEqual(block.difficulty-1);
        });

        it('minimum difficulty is 1', ()=>{
            block.difficulty = -1;
            expect(Block.adjustDifficulty({
                originalBlock: block,
            })).toEqual(1);
        });
    });

});