const cryptoHash = require('./crypto-hash');

describe('cryptoHash()', ()=>{

    it('generates a SHA-256 hashed output', ()=>{
        expect(cryptoHash('isaac')).toEqual('65966d9698a796c86bb3886972732d1441ebe052845578d489288faa37c48242');
    });

    it('generates the same hash with the same input data', ()=>{
        expect(cryptoHash('a', 'b', 'c')).toEqual(cryptoHash('c', 'b', 'a'));
    });

    it('produces a unique hash when the props have changed',()=>{
        const foo={};
        const originalHash = cryptoHash(foo);
        foo.a = 'a';

        expect(cryptoHash(foo)).not.toEqual(originalHash);
    })
});