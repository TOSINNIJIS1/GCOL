import React from 'react';
import './nav.scss'
import {Link} from 'react-router-dom';

export default function Nav () {


    return(
        <div className='navContainer'>
            <Link to='/'>
            <h1> GCOL </h1>
            </Link>

            <nav>
                <ul>
                    <Link to='/rules'>
                    <li> Rules  </li>
                    </Link>

                    <Link to='/play'>
                    <li> Play </li>
                    </Link>

                    <Link to='/about'>
                    <li> About </li>
                    </Link>
                    
                    
                    
                </ul>
            </nav>
        </div>
    )
}