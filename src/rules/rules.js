import React from 'react';


function Rules () {


    return(
        <div>
            <h1> Conway Game of Life Rules </h1>
            <ul>
                <li> If a dead cell has exactly three live neighbours, it comes to life </li>
                <li> If a live cell has less than two live neighbours, it dies </li>
                <li> If a live cell has more than three live neighbours, it dies </li>
                <li> If a live cell has two or three live neighbours, it continues living </li>
            </ul>

        </div>
    )
}

export default Rules