import React, { Component } from "react";
import { Link, Outlet } from "react-router-dom";
import logo from "../items/logo.png";

export default class App extends Component {
    state = {
        walletInfo: {}
    }

    componentDidMount() {
        fetch(`${document.location.origin}/api/wallet-info`)
            .then(res => res.json())
            .then(walletInfo => this.setState({ walletInfo }))
    }

    render() {
        const { address, balance } = this.state.walletInfo;
        return (
            <div className="App">
                <img className="logo" src={logo} alt="logo" />
                <br />
                <h2>Welcome to the Block</h2>
                <br />
                <div>
                    <Link to='/blocks'>Blocks</Link>
                    {' | '}
                    <Link to='/transaction'>Send-Crypto</Link>
                    {' | '}
                    <Link to='/transaction-pool'>Transaction Pool</Link>
                </div>
                <br />
                <div className="WalletInfo">
                    <div>Your wallet address: {address}</div>
                    <div>Your balance: {balance}</div>
                </div>
                <br />
                <Outlet />
            </div>
        );
    }
}