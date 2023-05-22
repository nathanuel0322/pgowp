import React, {useState, useEffect} from 'react';
import { Link, useLocation } from "react-router-dom";
import '../../assets/css/hamburger.css';
import '../../assets/css/Navbar.css'
import { IoReorderThreeOutline, IoReorderThree } from "react-icons/io5";

const HamburgerNav = ({drawerfunc}) => {
    const [currentpage, setcurrentpage] = useState(null);
    const location = useLocation();

    useEffect(() => {
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

    return (
        <nav id='mobilenav'>
            <div id="headerdiv">
                <div id='brand'>
                    <div id='logo'>
                        <Link to="/" id='logolink'>
                            <img id='logoimg' src={require('../../assets/images/favicon-96x96.png')} alt="PGOWP Logo" />
                        </Link>
                    </div>
                    <div id="captionwrap" className='flex text-white pt-1 text-[1.45rem]'>
                        {currentpage}
                    </div>
                </div>
                <div id="bbdiv" className='mx-0 text-[0rem] text-right'>
                    <a target="_blank" id='mobilebook' className='px-5 text-[1.45rem]' rel="noopener noreferrer" href="https://ymonerhexbfwnegoml.10to8.com">Book Online</a>
                </div>
                <IoReorderThreeOutline color='white' size={50} onClick={() => {drawerfunc(true)}} />
            </div>
        </nav>     
  );
}

export default HamburgerNav;

