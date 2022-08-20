import React from 'react';
import '../assets/css/gamelist.css';
import PS4Pro from "../assets/images/Ps4Pro.jpg";
import PSVR from "../assets/images/PSVR.jpg";
import XboxOneX from "../assets/images/XboxOneX.jpg"
import Switch from "../assets/images/Switch.jpg";
import FireTab from "../assets/images/firetab.jpeg" ;
import PS5 from "../assets/images/ps5.jpg";
import XBX from "../assets/images/XBX.jpeg";
import Infiinity from "../assets/images/infinitygame.jpeg";
import { useMediaQuery } from 'react-responsive';

import Stylesheet from "reactjs-stylesheet";

export default function Gamelist(){
    const mobile = useMediaQuery({query: '(max-width: 767px)'});
    return(
        <div>
            <div>
                <strong>
                    <p style={gameliststyles.text}>
                        Our game truck carries all the latest game systems & games, and we're always updating.
                        <br />
                        Even better, we have <span style={{color: 'blueviolet'}} class="blinking"><strong> JUST DANCE </strong></span> 
                        for the dancers!
                    </p>
                </strong>
            </div>
            {!mobile ?
                <p style={{marginTop: '-5%', backgroundColor: 'white'}}>
                    <p style={gameliststyles.imageflex}>
                        <img style={gameliststyles.leftpics} src={PS4Pro} alt="Backpic" width="40%" height="35%" />
                        <img style={gameliststyles.rightpics} src={PSVR} alt="Backpic" width="40%" height="30%" />
                    </p>
                    <p style={gameliststyles.imageflex}>
                        <img style={gameliststyles.leftpics} src={XboxOneX}  alt="Backpic" width="40%" height="40%" />
                        <img style={gameliststyles.rightpics} src={Switch}  alt="Backpic" width="40%" height="50%" />
                    </p>
                    <p style={gameliststyles.imageflex}>
                        <img style={gameliststyles.leftpics} src={FireTab} alt="Backpic" width="40%" height="40%" />
                        <img style={gameliststyles.rightpics} src={PS5} alt="Backpic" width ="40%" height="40%" />
                    </p>
                    <p style={gameliststyles.imageflex}>
                        <img src={XBX} alt="Backpic" width ="35%" height="60%" class="XBX" />
                    </p>
                </ p>
            :
                <p style={{marginTop: '10%', backgroundColor: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                    <img src={PS4Pro} alt="Backpic" width="100%" height="35%" />
                    <img src={PSVR} alt="Backpic" width="100%" height="30%" />
                    <img src={XboxOneX}  alt="Backpic" width="100%" height="40%" />
                    <img src={Switch}  alt="Backpic" width="100%" height="50%" />
                    <img src={FireTab} alt="Backpic" width="100%" height="40%" />
                    <img src={PS5} alt="Backpic" width ="100%" height="40%" />
                    <img src={XBX} alt="Backpic" width ="100%" height="60%" class="XBX" />
                    <img src={Infiinity} alt="Backpic" width ="100%" height="60%"/>
                </p>
            }
        </div>
    )
}

const gameliststyles = Stylesheet.create({
    text: {
        marginTop: '10%',
        textAlign: 'center',
        fontSize: '6vw',
        fontFamily: "'Nunito', sans-serif",
        color: 'white',
    },

    imageflex: {
        marginTop: '10%',
        flexDirection: 'row',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },

    leftpics: {
        marginRight: '5%',
    },

    rightpics: {
        marginLeft: '5%',
    },
})

