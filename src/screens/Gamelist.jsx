import React from 'react';
import '../assets/css/gamelist.css';
import PS4Pro from "../assets/images/Ps4Pro.jpg";
import PSVR from "../assets/images/PSVR.jpg";
import XboxOneX from "../assets/images/XboxOneX.jpg"
import Switch from "../assets/images/Switch.jpg";
import FireTab from "../assets/images/firetab.jpeg" ;
import PS5 from "../assets/images/ps5.jpg";
import XBX from "../assets/images/XBX.jpeg";

import Stylesheet from "reactjs-stylesheet";

export default function Gamelist(){
    return(
        <div>
            <div>
                <strong>
                    <p style={gameliststyles.text}>
                        Our game truck carries all the latest game systems & games, and we're always updating.
                        <br />
                        Our game truck also includes <span class="blinking"><strong> FORTNITE </strong></span> via an ethernet cable 
                        connection to your home Wi-Fi.
                        <br />
                        Even better, we have <span style={{color: 'blueviolet'}} class="blinking"><strong> JUST DANCE </strong></span> 
                        for the dancers!
                    </p>
                </strong>
            </div>
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
        </div>
    )
}

const gameliststyles = Stylesheet.create({
    text: {
        marginTop: '10%',
        textAlign: 'center',
        fontSize: '200%',
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

