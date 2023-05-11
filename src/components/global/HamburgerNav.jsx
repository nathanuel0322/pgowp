import React, {useState, useEffect} from 'react';
import { Link, useLocation } from "react-router-dom";
import '../../assets/css/hamburger.css';
import { IoReorderThree } from "react-icons/io5";

const HamburgerNav = ({drawerfunc}) => {
    const [menuclicked, setmenuclicked] = useState(false);
    const [currentpage, setcurrentpage] = useState(null);
    const location = useLocation();

    useEffect(() => {
        console.log("cp:", location.pathname)
        if (location.pathname === "/services"){
            setcurrentpage("Services");
        }
        else if (location.pathname === "/packages"){
            setcurrentpage("Packages");
        }
        else if (location.pathname === "/"){
            setcurrentpage("Home");
        }
        else if (location.pathname === "/gamelist"){
            setcurrentpage("Game List");
        }
        else if (location.pathname === "/contactus"){
            setcurrentpage("Contact Us");
        }
        else if (location.pathname === "/about"){
            setcurrentpage("About");
        }
        else if (location.pathname === "/e-invites"){
            setcurrentpage("E-Invites");
        }
    }, [location.pathname])

    useEffect(() => {
        const handleClick = (event) => {
            setmenuclicked(false);
        };
    
        const links = document.querySelectorAll('#headerdiv > ul a');
        links.forEach(link => {
            link.addEventListener('click', handleClick);
        });
    
        return () => {
            links.forEach(link => {
                link.removeEventListener('click', handleClick);
            });
        };
    }, []);

    return (
        <header>
            <div id="headerdiv">
                <ul>
                    <li>
                        <Link to={currentpage === "Home" ? "/" : currentpage === "Services" ? "/services" : currentpage === "Packages" ? 
                            "/packages" : currentpage === "Game List" ? "/gamelist" : currentpage === "Contact" ? "/contactus" : 
                            currentpage === "About" && "/about"} id="pagelabel"
                        >
                            {currentpage}
                        </Link>
                        <div onClick={() => {drawerfunc(true)}}>
                            <IoReorderThree size={50} />
                        </div>
                    </li>
                    <Link to={currentpage === "Services" ? "/" : "/services"} style={{display: menuclicked ? 'flex' : 'none'}}>
                        {currentpage === "Services" ? "Home" : "Services"} 
                    </Link>
                    <li style={{display: menuclicked ? 'flex' : 'none'}}>
                        <a target="_blank" rel="noopener noreferrer" href="https://ymonerhexbfwnegoml.10to8.com">Book Online</a>
                    </li>
                    <Link to={currentpage === "Packages" ? "/" : "/packages"} style={{display: menuclicked ? 'flex' : 'none'}}>
                        {currentpage === "Packages" ? "Home" : "Packages"} 
                    </Link>
                    <Link to={currentpage === "Game List" ? "/" : "/gamelist"} style={{display: menuclicked ? 'flex' : 'none'}}>
                        {currentpage === "Game List" ? "Home" : "Game List"}
                    </Link>
                    <li style={{display: menuclicked ? 'flex' : 'none'}}>
                        <a target="_blank" rel="noopener noreferrer"
                            href="https://www.google.com/maps/place/Prestigious+Gaming+On+Wheels+Plus/@40.6717448,-73.7831725,3a,98y,90t/data=!3m8!1e2!3m6!1sAF1QipNxsYt_rIckjjQfRaQBWaA0pEgAJ_zCm3qYyVA!2e10!3e12!6shttps:%2F%2Flh5.googleusercontent.com%2Fp%2FAF1QipNxsYt_rIckjjQfRaQBWaA0pEgAJ_zCm3qYyVA%3Dw203-h114-k-no!7i800!8i450!4m7!3m6!1s0x89c267ef4ab3d5c7:0x77d90889fb9bc7fc!8m2!3d40.671612!4d-73.7834759!14m1!1BCgIgAQ#" 
                        >
                            Gallery
                        </a>
                    </li>
                    <Link to={currentpage === "E-Invites" ? "/" : "/BdayCard"} style={{display: menuclicked ? 'flex' : 'none'}}>
                        {currentpage === "E-Invites" ? "Home" : "E-Invites"}
                    </Link>
                    <Link to={currentpage === "Contact" ? "/" : "/contact"} style={{display: menuclicked ? 'flex' : 'none'}}>
                        {currentpage === "Contact" ? "Home" : "Contact"}
                    </Link>
                    <Link to={currentpage === "About" ? "/" : "/about"} style={{display: menuclicked ? 'flex' : 'none'}}>
                        {currentpage === "About" ? "Home" : "About"}
                    </Link>
                </ul>
            </div>      
        </header>
  );
}

export default HamburgerNav;

