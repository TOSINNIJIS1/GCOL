import React from 'react';
import './nav.scss';
import { Link, useLocation } from 'react-router-dom';

export default function Nav() {
    const location = useLocation();
    return <header className="navContainer">
        <Link className="brand" to="/"><span>VOAI</span><b>—CGOL</b></Link>
        <nav aria-label="Primary navigation"><Link className={location.pathname === '/' || location.pathname === '/play' ? 'active' : ''} to="/">Simulation</Link><Link className={location.pathname === '/duel' ? 'active' : ''} to="/duel">1v1 Duel</Link><Link className={location.pathname === '/rules' ? 'active' : ''} to="/rules">Rules</Link><Link className={location.pathname === '/about' ? 'active' : ''} to="/about">About</Link></nav>
        <span className="navMark" aria-hidden="true">◌</span>
    </header>;
}
