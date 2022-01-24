import React from "react";
import { render } from "react-dom";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import history from "./history";
import "./index.css";
import App from "./components/App";
import Blocks from "./components/Blocks";
import ConductTrans from "./components/ConductTrans";
import TransactionPool from "./components/TransactionPool";


render(
    <BrowserRouter history={history}>
        <Routes>
            <Route exact path="/" element={<App/>} />
            <Route path="/blocks" element={<Blocks/>} />
            <Route path="/transaction" element={<ConductTrans/>} />
            <Route path="/transaction-pool" element={<TransactionPool/>} />
        </Routes>
    </BrowserRouter>,

    document.getElementById("root")
);