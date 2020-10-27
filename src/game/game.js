import React, { useState, useRef, useCallback } from 'react';
import './game.scss';
import produce from 'immer';
import OnClickButton from '../onClick/onClickButton'


const Game = ({gridRow, gridCol, operations}) => {
    // Board
    const generateEmptyBoard = () => {
        // Loop through the grid row and col for the actual board
        const row = [];
        
        for (let i = 0; i < gridRow; i++) {
            row.push(Array.from(Array(gridCol), () => 0));
        }
        return row;
        // looping ends here
    };

    // State for the grid
    const [state, setState] = useState(() => {
        return generateEmptyBoard();
    })
    // Ends Here


    // Start state. then stop the state with setStart 
    const [start, setStart] = useState(false);

    function Start () {
        setStart(!start);
        if (!start) {
            startRef.current = true;
        } startCGOL();
    }
    // ends Here

    // the reference for the start state
    const startRef = useRef(start);
    startRef.current = start;

    // Reference ends here

    // Creating a random board
    function Random () {
        const row = [];
        
        for (let i = 0; i < gridRow; i++) {
            row.push(Array.from(Array(gridCol), () => (Math.random() > 0.7)));
        }
        setState(row);
    }
    // random board ends here

    // Clear the board grid 
    function Clear () {
        setState(generateEmptyBoard())

    }

    // ends here

    // Start function
    const startCGOL = useCallback(() => {
        if (!startRef.current) {
            return;
        }

        //  changing the state so when you click each grid space, it shows up and follows the rules
        setState(g => {
            return produce(g, stateCopy => {
                for (let i = 0; i < gridRow; i++) {
                    for (let j = 0; j < gridCol; j++) {
                        let neighbor = 0;
                        operations.forEach(([x, y]) => {
                            const newI = i + x;
                            const newJ = j + y;
                            if (newI >= 0 && newI < gridRow && newJ >= 0 && newJ < gridCol) {
                                neighbor += g[newI][newJ]
                            }
                        });

                        // Rules 
                        if (neighbor < 2 || neighbor > 3) {
                            stateCopy[i][j] = 0;
                        } else if (g[i][j] === 0 && neighbor === 3) {
                            stateCopy[i][j] = 1;
                        }
                    }
                }
            })
        }) 
        setTimeout(startCGOL, 1000) // eslint-disable-next-line
    },[])

    
    return (
        <div>
            <OnClickButton start={start} Start={Start} Random={Random} startCGOL={startCGOL} Clear={Clear} />

            <div className='board' style={{display: 'grid', gridTemplateColumns: `repeat(${gridCol}, 20px)`}}>
                {state.map((a, i) => 
                    a.map((b, j) => (
                        <div key={`${i}-${j}`}
                        className='grid'
                        onClick={() => {
                            const newState = produce(state, stateCopy => {
                                stateCopy[i][j] = state[i][j] ? 0 : 1;
                            })
                            setState(newState)
                        }}
                        style={{width: 20, height: 20, backgroundColor: state[i][j] ? '#66FCF1' : undefined, border: '1px solid white' }}>
                        </div>
                )))}
            </div>
        </div>
    )
}


export default Game