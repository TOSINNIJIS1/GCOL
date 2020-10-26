import React from 'react';

export default function OnclickButton ({start, Start, Random, startCGOL, Clear }) {


return (
    <div className='buttons'>
        <button className='start' onClick={Start}>
            {start ? 'pause' : 'play' }
        </button>

        <button className='random' onClick={Random}>
            random
        </button>

        <button onClick={(e) => {
            setTimeout(startCGOL(e), 2000)
        }}>
            x2
        </button>

        <button onClick={(e) => {
            setTimeout(startCGOL(e), 5000)
        }}>
            x5
        </button>

        <button className='clear' onClick={Clear}>
            Clear
        </button>


        </div>
    )
}