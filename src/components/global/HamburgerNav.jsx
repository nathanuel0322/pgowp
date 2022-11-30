import React, {useState, useEffect} from 'react';
import { Link, useLocation } from "react-router-dom";
import '../../assets/css/hamburger.css';
import Stylesheet from 'reactjs-stylesheet';
import { IoReorderThree } from "react-icons/io5";
import { useMediaQuery } from 'react-responsive';

const HamburgerNav = () => {
    const location = useLocation();
    const [currentpage, setcurrentpage] = useState(null);
    useEffect(() => {
        if (location.pathname === "/servicespage"){
            setcurrentpage("Services");
        }
        else if (location.pathname === "/packagespage"){
            setcurrentpage("Packages");
        }
        else if (location.pathname === "/"){
            setcurrentpage("Home");
        }
        else if (location.pathname === "/gamelistpage"){
            setcurrentpage("Game List");
        }
        else if (location.pathname === "/contactpage"){
            setcurrentpage("Contact");
        }
        else if (location.pathname === "/aboutpage"){
            setcurrentpage("About");
        }
        else if (location.pathname === "/BdayCard"){
            setcurrentpage("E-Invites");
        }
    }, [location.pathname])

    const mobile = useMediaQuery({query: '(min-width: 0px)'});
    const [menuclicked, setmenuclicked] = useState(false);

    const hamburgerstyles = Stylesheet.create({
        tabs: {
            display: menuclicked ? 'flex' : 'none',
            paddingLeft: '4%',
            paddingTop: '2.5%',
            paddingBottom: '2.5%',
            width: '100%',
        }
    })
    return (
        <header>
            <div>
                <ul style={{display: 'flex', flexDirection: 'column', backgroundColor: 'blue', color: 'white', fontFamily: "'Teko', sans-serif", 
                    fontSize: '150%', alignItems: 'flex-start', zIndex: 999, width: '100%', top: '0%'}}
                >
                    <li style={Object.assign({}, hamburgerstyles.tabs, {display: 'flex', flexDirection: 'row', alignItems: 'center', 
                        justifyContent: 'space-between', width: '100%', backgroundColor: menuclicked ? 'orange' : 'blue'})}
                    >
                        <Link to={currentpage === "Home" ? "/" : currentpage === "Services" ? "/servicespage" : currentpage === "Packages" ? 
                            "/packagespage" : currentpage === "Game List" ? "/gamelistpage" : currentpage === "Contact" ? "/contactpage" : 
                            currentpage === "About" && "/aboutpage"} 
                            style={{paddingRight: mobile ? '64%' : '83%'}} onClick={() => setmenuclicked(false)}
                        >
                            {currentpage}
                        </Link>
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingRight: '2%'}}
                            onClick={() => setmenuclicked(!menuclicked)}
                        >
                            <IoReorderThree size={50} />
                        </div>
                    </li>
                    <Link to={currentpage === "Services" ? "/" : "/servicespage"} style={hamburgerstyles.tabs} onClick={() => setmenuclicked(false)}>
                        {currentpage === "Services" ? "Home" : "Services"} 
                    </Link>
                    <li style={Object.assign({}, hamburgerstyles.tabs, {display: menuclicked ? 'flex' : 'none',})} onClick={() => setmenuclicked(false)}>
                        <a target="_blank" rel="noopener noreferrer" href="https://ymonerhexbfwnegoml.10to8.com">Book Online</a>
                    </li>
                    <Link to={currentpage === "Packages" ? "/" : "/packagespage"} style={hamburgerstyles.tabs} onClick={() => setmenuclicked(false)}>
                        {currentpage === "Packages" ? "Home" : "Packages"} 
                    </Link>
                    <Link to={currentpage === "Game List" ? "/" : "/gamelistpage"} style={hamburgerstyles.tabs} onClick={() => setmenuclicked(false)}>
                        {currentpage === "Game List" ? "Home" : "Game List"}
                    </Link>
                    <li style={Object.assign({}, hamburgerstyles.tabs, {display: menuclicked ? 'flex' : 'none',})} onClick={() => setmenuclicked(false)}>
                        <a target="_blank" rel="noopener noreferrer"
                            href="https://www.google.com/maps/place/Prestigious+Gaming+On+Wheels+Plus/@40.6717448,-73.7831725,3a,98y,90t/data=!3m8!1e2!3m6!1sAF1QipNxsYt_rIckjjQfRaQBWaA0pEgAJ_zCm3qYyVA!2e10!3e12!6shttps:%2F%2Flh5.googleusercontent.com%2Fp%2FAF1QipNxsYt_rIckjjQfRaQBWaA0pEgAJ_zCm3qYyVA%3Dw203-h114-k-no!7i800!8i450!4m7!3m6!1s0x89c267ef4ab3d5c7:0x77d90889fb9bc7fc!8m2!3d40.671612!4d-73.7834759!14m1!1BCgIgAQ#" 
                        >
                            Gallery
                        </a>
                    </li>
                    <Link to={currentpage === "E-Invites" ? "/" : "/BdayCard"} style={hamburgerstyles.tabs} onClick={() => setmenuclicked(false)}>
                        {currentpage === "E-Invites" ? "Home" : "E-Invites"}
                    </Link>
                    <Link to={currentpage === "Contact" ? "/" : "/contactpage"} style={hamburgerstyles.tabs} onClick={() => setmenuclicked(false)}>
                        {currentpage === "Contact" ? "Home" : "Contact"}
                    </Link>
                    <Link to={currentpage === "About" ? "/" : "/aboutpage"} style={hamburgerstyles.tabs} onClick={() => setmenuclicked(false)}>
                        {currentpage === "About" ? "Home" : "About"}
                    </Link>
                </ul>
            </div>
            
        </header>
  );
}

export default HamburgerNav;

