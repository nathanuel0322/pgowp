import React, { useEffect, useRef } from 'react';
import PS4Pro from "../assets/images/Ps4Pro.jpg";
import PSVR from "../assets/images/PSVR.jpg";
import XboxOneX from "../assets/images/XboxOneX.jpg"
import Switch from "../assets/images/Switch.jpg";
import FireTab from "../assets/images/firetab.jpeg" ;
import PS5 from "../assets/images/ps5.jpg";
import XBX from "../assets/images/XBX.jpeg";
import InfinityTab from "../assets/images/infinitygame.jpeg";
import Oculus from "../assets/images/OQ2.png";
import { useMediaQuery } from 'react-responsive';
import Typed from "typed.js";
import '../assets/css/gamelist.css';

export default function Gamelist(){
    // Create reference to store the DOM element containing the animation
    const el = useRef(null);
    
    // Create reference to store the Typed instance itself
    const typed = useRef(null);

    const options = {
        strings: ['JUST DANCE'],
        typeSpeed: 45,
        backSpeed: 45,
        loop: true,
    };
      
    useEffect(() => {
        // elRef refers to the <span> rendered below
        typed.current = new Typed(el.current, options);
      
        return () => {
            // Make sure to destroy Typed instance during cleanup
            // to prevent memory leaks
            typed.current.destroy();
        }
    }, [])

    const mobile = useMediaQuery({query: '(max-width: 767px)'});
    return(
        <div id='gamelistdiv'>
            <div>
                <strong>
                    <p id="gamelisttext">
                        Our game truck carries all the latest game systems & games, and we're always updating.
                        <br />
                        Even better, we have <br /> <span className="blinking" ref={el} /><br /> 
                        for the dancers!
                    </p>
                </strong>
            </div>
            {mobile ?
                <p id="mobilegamelistp">
                    <img src={PS4Pro} alt="Backpic" width="100%" height="35%" />
                    <img src={PSVR} alt="Backpic" width="100%" height="30%" />
                    <img src={XboxOneX}  alt="Backpic" width="100%" height="40%" />
                    <img src={Switch}  alt="Backpic" width="100%" height="50%" />
                    <img src={FireTab} alt="Backpic" width="100%" height="40%" />
                    <img src={PS5} alt="Backpic" width ="100%" height="40%" />
                    <img src={XBX} alt="Backpic" width ="100%" height="60%" className="XBX" />
                    <img src={InfinityTab} alt="Backpic" width ="100%" height="60%"/>
                    <img src={Oculus} alt="Backpic" width ="100%" height="60%" />
                </p>
            :
                <p id='gamelistp'>
                    <p>
                        <img src={PS4Pro} alt="Backpic" width="40%" height="35%" />
                        <img src={PSVR} alt="Backpic" width="40%" height="30%" />
                    </p>
                    <p>
                        <img src={XboxOneX}  alt="Backpic" width="40%" height="40%" />
                        <img src={Switch}  alt="Backpic" width="40%" height="50%" />
                    </p>
                    <p>
                        <img src={FireTab} alt="Backpic" width="40%" height="40%" />
                        <img src={PS5} alt="Backpic" width ="40%" height="40%" />
                    </p>
                    <p>
                        <img src={XBX} alt="Backpic" width="40%" height="40%" className="XBX" />
                        <img src={InfinityTab} alt="Backpic" width ="40%" height="40%" />
                    </p>
                    <p>
                        <img src={Oculus} alt="Backpic" width ="35%" height="60%" />
                    </p>
                </ p>
            }
        </div>
    )
}