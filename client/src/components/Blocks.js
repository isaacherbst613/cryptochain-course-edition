import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Block from './Block';
import { Button } from 'react-bootstrap';

export default class Blocks extends Component {
    state = {
        blocks: [], paginatedId: 0, blocksLength: 0
    }

    componentDidMount() {
        fetch(`${document.location.origin}/api/blocks/length`)
        .then(res => res.json())
        .then(res => this.setState({ blocksLength: res.length }));

        this.fetchPaginatedBlocks(this.state.paginatedId);
    }

    fetchPaginatedBlocks = (paginatedId) => {
        fetch(`${document.location.origin}/api/blocks/${paginatedId}`)
            .then(res => res.json())
            .then(blocks => this.setState({ blocks }))
    }
    render() {

        return (
            <div>
                <div><Link to='/'>Home</Link></div>
                <br/>
                <h3>Blocks</h3>
                {
                    [...Array(Math.ceil(this.state.blocksLength/3)).keys()].map(i => {
                        const id = i + 1;
                        return (
                            <span key={i}>
                                <Button variant='danger' size='sm' onClick={()=> this.fetchPaginatedBlocks(id)}>{id}</Button>{' '}
                                </span>
                        )
                    })
                }
                {this.state.blocks.map(block => {
                    return (
                        
                        <Block key={block.hash} block={block} />
                    );
                })}
            </div>
        )
    }
}
