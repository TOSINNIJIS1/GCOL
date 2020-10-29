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
            row.push(Array.from(Array(gridCol), () => 0))
        }
        return row;
        // looping ends here
    };
    
    const [gen, setGen] = useState({
        generation: 0
    })

    // State for the grid
    const [state, setState] = useState(() => {
        return generateEmptyBoard();
    })
    // Ends Here



    // Start state. then stop the state with setStart 
    const [start, setStart] = useState(0);

    function Start () {
        setStart(!start);
        if (!start) {
            startRef.current = true;
        } startCGOL();
    }
    // ends Here

    const [click, setClick] =  useState(0)

    function Click () {
        setClick(click);
        if (!click) {
            startRef.current = true;
        } startCGOL();
    }
        
    // the reference for the start state
    const startRef = useRef(start);
    startRef.current = start
    

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
        // setState(generateEmptyBoard(), generations = 9 )
        setState(() => generateEmptyBoard())
        setGen({
            generation: 0
        })
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
                        let neighbor = 0; // eslint-disable-next-line
                        operations.map(([x, y]) => { 
                            const newI = x + i;
                            const newJ = y + j;                            
                            if (newI >= 0 && newI < gridRow && newJ >= 0 && newJ < gridCol) {
                                neighbor += g[newI][newJ]
                            }
                        });

                        // Rules 
                        if (neighbor < 2 || neighbor > 3) { // If fewer than 2 dies and more than 3 live
                            stateCopy[i][j] = 0;    // position
                        } else if (g[i][j] === 0 && neighbor === 3) { // if the current grid is dead and  3 neighbor live
                            stateCopy[i][j] = 1;    //position
                        }

                    }
                    
                }
                
            })
            
        }) 
        setGen({
            generation: gen.generation += 1
        })

        setTimeout(startCGOL, 1000) // eslint-disable-next-line
    },[])
    
    return (
        <div>
            <OnClickButton start={start} Start={Start} Click={Click} Random={Random} startCGOL={startCGOL} Clear={Clear} generations={gen.generation} />
            
            <div className='game'>
            
                <div className='board'
                style={{width: 1, border: `1px solid`}}
                >
                    {state.map((a, i) => 
                        a.map((b, j) => (
                            <div key={`${i}-${j}`}
                            className='grid'
                            onClick={() => {
                                const newState = produce(state, stateCopy => {
                                    stateCopy[i][j] = state[i][j] ? 0 : 1;  // if the position is alive we can make it dead
                                })
                                setState(newState)
                            }}
                            style={{backgroundColor: state[i][j] ? '#66FCF1' : undefined } }>
                            </div>
                )))}

            </div>
            <h1 className='gen'> Generation: {gen.generation} </h1>

        </div>
    </div>
    )
}


export default Game