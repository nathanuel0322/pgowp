import React from 'react';
import "../../assets/css/Navbar.css"
import { Link } from "react-router-dom";

const Navbar= () =>{
  return (
    <header className="header">
        <div className="mid">
            <ul className="navbar">
                <Link to="/" className="left">Home</Link>
                <Link to="/services" className='lists'>Services</Link>
                <a target="_blank" className='lists' rel="noopener noreferrer" href="https://ymonerhexbfwnegoml.10to8.com">Book Online</a>
                <Link to="/packages" className='lists'>Packages</Link>
                <Link to="/gamelist" className='lists'>Game List</Link>
                <a className='lists' target="_blank" rel="noopener noreferrer"
                    href="https://www.google.com/maps/place/Prestigious+Gaming+On+Wheels+Plus/@40.6717448,-73.7831725,3a,98y,90t/data=!3m8!1e2!3m6!1sAF1QipNxsYt_rIckjjQfRaQBWaA0pEgAJ_zCm3qYyVA!2e10!3e12!6shttps:%2F%2Flh5.googleusercontent.com%2Fp%2FAF1QipNxsYt_rIckjjQfRaQBWaA0pEgAJ_zCm3qYyVA%3Dw203-h114-k-no!7i800!8i450!4m7!3m6!1s0x89c267ef4ab3d5c7:0x77d90889fb9bc7fc!8m2!3d40.671612!4d-73.7834759!14m1!1BCgIgAQ#" 
                >
                    Gallery
                </a>
                <Link to="/e-invites" className='lists'>E-Invites</Link>
                <Link to="/contactus"className='lists'>Contact</Link>
                <Link to="/about" className="right">About</Link>
            </ul>
        </div>
        
    </header>
  );
}

export default Navbar;