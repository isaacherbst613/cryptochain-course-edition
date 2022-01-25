import React, { Component } from 'react';
import { FormGroup, FormControl, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import history from '../history';

export default class conductTrans extends Component {
    state = { recipient: '', amount: 0, knownAddresses: [] };

    componentDidMount() {
        fetch(`${document.location.origin}/api/known-addresses`)
        .then(res => res.json())
        .then(data => this.setState({ knownAddresses: data }));
    }

    updateRecipient = (e) => {
        this.setState({ recipient: e.target.value });
    }

    //validate no letters (or it will become NaN)
    updateAmount = (e) => {
        this.setState({ amount: Number(e.target.value) });
    }

    conductTransaction = () => {
        const { recipient, amount } = this.state;
        fetch(`${document.location.origin}/api/transact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipient, amount })
        }).then(res => res.json())
            .then(json => {
                alert(json.message || json.type);
                //react router v6 won't reload the page to the new url
                //replace with functional component and use navigate('/transaction-pool') hook
                history.push('/transaction-pool');
            });
    }

    render() {
        return (
            <div className='conductTrans'>
                <Link to='/'>Home</Link>
                <br />
                <h3>Conduct Transaction</h3>
                <br/>
                <h3>Known addresses</h3>
                {this.state.knownAddresses.map(address => (
                    <div id="add" key={address}>{address}</div>
                ))}
                <FormGroup>
                    <FormControl input='text' placeholder='send to' value={this.state.recipient} required onChange={this.updateRecipient} />
                </FormGroup>
                <br />
                <FormGroup>
                    <FormControl input='number' placeholder='amount' value={this.state.amount} onChange={this.updateAmount} />
                </FormGroup>
                <br/>
                <div>
                    <Button variant="danger" size='sm' onClick={this.conductTransaction}>Send</Button>
                </div>

            </div>
        )
    }
}
