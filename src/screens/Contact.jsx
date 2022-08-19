import React from 'react';
import BackgroundImage from '../assets/images/Rectangle.jpg';
import Stylesheet from "reactjs-stylesheet";
import '../assets/css/contact.css';

export default function Contact(){
    return(
        <div>
            <img style={contactstyles.image} src={BackgroundImage} alt="Rectangle Poster" height="100%" width="100%" class="Rectangle" />
            <div style={contactstyles.ptext}>
                <span style={{textDecoration: 'underline',}}>Our Contact Numbers </span>
                <br />
                <a href="tel:718-673-8529">718-673-8529</a>
                <br />
                AND 
                <br />
                <a href="tel:718-496-1267">718-496-1267</a>
                <br />
                <br />
                <p>Email Us!</p>
                <br />
                <button style={{textDecoration: 'underline', fontSize: '4vw'}} onClick={() => window.location = 'mailto:tbnd@prestigiousgamingonwheelsplus.com'}>
                    tbnd@prestigiousgamingonwheelsplus.com
                </button>
            </div>
        </div>
    )
}

const contactstyles = Stylesheet.create({
    image: {
        marginTop: '5.5%',
    },

    ptext: {
        position: 'absolute',
        width: '100%',
        textAlign: 'center',
        fontSize: '225%',
        fontFamily: 'Aclonica',
        textDecoration: 'none',
        color: 'white',
        marginTop: '-75%',
    }
});



