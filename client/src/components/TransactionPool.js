import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Transaction from './Transaction';
import { Button } from 'react-bootstrap';
import history from '../history';

const POLL_INTERVAL_MS = 10000;

export default class TransactionPool extends Component {
    state={ transactionPoolMap: {} }

    fetchTransactionPool = () => {
        fetch(`${document.location.origin}/api/transaction-pool-map`)
            .then(res => res.json())
            .then(transactionPoolMap => {
                console.log(transactionPoolMap);
                this.setState({ transactionPoolMap })});
    }

    fetchMineTransactions = () => {
        fetch(`${document.location.origin}/api/mine-transactions`)
            .then(res => {
                if (res.status === 200) {
                    alert('successfully mined transaction');
                    history.push('/blocks');
                }else{
                    alert('failed to mine transaction');
                }
            })
    }
    
    componentDidMount() {
        this.fetchTransactionPool();

        this.interval = setInterval(() => {
            this.fetchTransactionPool();
        }, POLL_INTERVAL_MS);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    render() {
        return (
            <div className='transctionPool'>
                <div><Link to='/'>Home</Link></div>
                <br/>
                <h3>Transaction Pool</h3>

                {
                    Object.values(this.state.transactionPoolMap).map(transaction => {
                      return (
                        <div key={transaction.id}>
                            <hr/>
                            <Transaction transaction={transaction} />
                        </div>
                      )  
                    })
                }
                <hr/>
                <Button variant='danger' onClick={this.fetchMineTransactions}>Mine Transaction</Button>
            </div>
        )
    }
}
