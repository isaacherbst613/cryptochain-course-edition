import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import Transaction from './Transaction';

export default class Block extends Component {
    state = { displayTransactions: false }

    toggleTransactions = () => {
        this.setState({ displayTransactions: !this.state.displayTransactions })
    }

    get displayTransactions() {
        const { data } = this.props.block;

        const sData = JSON.stringify(data);
        const dataDisplay = `${sData.substring(0, 30)}...`;
        if(this.state.displayTransactions) {
            return (
                <div>
                    {data.map(transaction => (
                        <div key={transaction.id}>
                            <hr/>
                            <Transaction transaction={transaction} />
                        </div>
                    ))}
                    <br/>
                    <Button variant="danger" size='sm' onClick={this.toggleTransactions}>Hide Details</Button>
                </div>
            )
        }
        return (
            <div>
                <div>Data: {dataDisplay}</div>
                <Button variant="danger" size='sm' onClick={this.toggleTransactions}>Show Transaction Details</Button>
            </div>
        );
    }
    render() {
        const { timestamp, hash } = this.props.block;
        const hashDisplay = `${hash.substring(0, 10)}...`;

        return (
            <div className='Block'>
                <div>Hash: {hashDisplay}</div>
                <div>Timestamp: {new Date(timestamp).toLocaleString()}</div>
                {this.displayTransactions}
            </div>
        )
    }
}
