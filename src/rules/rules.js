import React from 'react';
import './rules.scss';

export default function Rules () {


    return(
        <div className='RulesContainer'>
            <h1> Conway Game of Life Rules </h1>
            <ol>
                <li> If a dead cell has exactly three live neighbours, it comes to life </li>
                <li> If a live cell has less than two live neighbours, it dies </li>
                <li> If a live cell has more than three live neighbours, it dies </li>
                <li> If a live cell has two or three live neighbours, it continues living </li>
            </ol>

        </div>
    )
}

