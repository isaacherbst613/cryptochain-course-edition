import React from 'react';

export default function Transaction({ transaction }) {
    const { input, outputMap } = transaction;
    const recipients = Object.keys(outputMap);

    function shortenName(name) {
        return name.length > 20 ? `${name.substring(0, 20)}...` : name;
    }
    return (
        <div className='trans'>

            {input.address !== '*authorized-reward*' ? <div>From: {shortenName(input.address)} | Balance: ${input.amount}</div> : <div>authorized-reward</div>}

            <br />
            {recipients.map(recipient => {
                if (input.address !== recipient) {
                    return (
                        <div key={recipient}>
                            To: {shortenName(recipient)} | Amount Sent: ${outputMap[recipient]}
                        </div>
                    );
                }
            })}
            <div key={input.address}>
                Senders remaining balance: ${outputMap[input.address]}
            </div>
        </div>
    );
}

