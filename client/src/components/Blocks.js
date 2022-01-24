import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Block from './Block';

export default class Blocks extends Component {
    state = {
        blocks: []
    }

    componentDidMount() {
        fetch(`${document.location.origin}/api/blocks`)
            .then(res => res.json())
            .then(blocks => this.setState({ blocks }))
    }
    render() {
        console.log(this.state.blocks);

        return (
            <div>
                <div><Link to='/'>Home</Link></div>
                <br/>
                <h3>Blocks</h3>
                {this.state.blocks.map(block => {
                    return (
                        
                        <Block key={block.hash} block={block} />
                    );
                })}
            </div>
        )
    }
}
