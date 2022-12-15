import React from 'react';
import { useMediaQuery } from 'react-responsive';
import BackgroundImage from '../assets/images/Rectangle.jpg';
import Stylesheet from "reactjs-stylesheet";

export default function Packages(){
    const tablet = useMediaQuery({query: '(min-width: 768px)'});
    return(
        <div>
            <img style={Object.assign({}, packagesstyles.image, {marginTop: '5.5%', opacity: 0.04,})} src={BackgroundImage} alt="Rectangle Poster" 
                height="100%" width="100%" class="Rectangle" 
            />
            <div style={Object.assign({}, packagesstyles.prices, {fontSize: tablet ? '3vw' : '6vw'})}>
                <strong>
                    <ul style={packagesstyles.HoursList}>
                        <li style={Object.assign({}, packagesstyles.HoursListlists, {textDecoration: 'underline',})}>Starting Packages</li> 
                        <br />
                        <li style={Object.assign({}, packagesstyles.HoursListlists, {fontSize: '50%',})}>*Prices subject to change in the near future*</li> 
                        <br />
                        <li style={packagesstyles.HoursListlists}>2 Hour Video Gaming Party - $500</li> <br />
                        <li style={packagesstyles.HoursListlists}>3 Hours - $650</li> <br />
                        <li style={packagesstyles.HoursListlists}>Each Additional Hour - $150</li> <br />
                        <li style={packagesstyles.HoursListlists}>Laser Tag Party! - $700</li>
                        <li style={Object.assign({}, packagesstyles.HoursListlists, {fontFamily: "'Goblin One', cursive,", color: '#FF9800',})}>3-Hour Movie Package - $375 (Contact for More Info)</li> 
                        <li style={Object.assign({}, packagesstyles.HoursListlists, {color: 'red'})}>*Birthday Child receives a Free Birthday T-Shirt!</li>
                        <li style={packagesstyles.HoursListlists}>All Party Attendants receive Prestigious Gaming Wristbands!  </li>
                        <li style={packagesstyles.HoursListlists}><span style={packagesstyles.PLUS}>*PLUS</span> - gives you additional amenities for the duration of the Game Trailer 
                        Party!</li> 
                        <br />
                        <li style={Object.assign({}, packagesstyles.HoursListlists, {color: '#FF5722'})}>Playstation VR! - $75 for kids 10 & up!</li>
                        <li style={Object.assign({}, packagesstyles.HoursListlists, {color: '#FF5722'})}>Extra Large Connect 4! - $60</li>
                        <li style={Object.assign({}, packagesstyles.HoursListlists, {color: '#FF5722'})}> Extra Large Yard Jenga! - $60</li>
                        <li style={Object.assign({}, packagesstyles.HoursListlists, {color: '#FF7E00'})}>Popcorn Machine! - $145</li>
                        <li style={Object.assign({}, packagesstyles.HoursListlists, {color: '#FF007F'})}>Cotton Candy Machine! - $200</li>
                        <li style={Object.assign({}, packagesstyles.HoursListlists, {marginTop: 20, textDecoration: 'underline'})} >For a More Fun and Exciting Party, You can also add:</li>
                        <li style={Object.assign({}, packagesstyles.HoursListlists, {color: '#FF5722'})}>Laser Tag with Live Scoring!</li>
                        <li style={Object.assign({}, packagesstyles.HoursListlists, {color: '#FF5722'})}>Additional $20 per person for two 15-minute sessions!</li>
                        <li style={Object.assign({}, packagesstyles.HoursListlists, {color: '#5a47a8'})}>Karaoke! - $75</li>
                        <li style={Object.assign({}, packagesstyles.HoursListlists, {color: '#E91E63'})}>Hot Dog Grill! - $100</li>
                        <li style={Object.assign({}, packagesstyles.HoursListlists, {color: '#05ff69'})}>Yard Games! - $80</li>
                        <li style={Object.assign({}, packagesstyles.HoursListlists, {fontSize: '80%',})}>Please note: All Parties over 4 hours will receive a complimentary plus item after 
                        game time is over!</li>
                    </ul>
                </strong>
            </div>
        </div>
    )
}

const packagesstyles = Stylesheet.create({
    image: {
        marginTop: '5.5%',
    },

    prices: {
        marginTop: '-77%',
        fontSize: '200%',
        fontFamily: "'Comfortaa', cursive",
        padding: '0rem 2rem'
    },
      
    HoursList: {
        flexDirection: 'column',
        listStyle: 'none',
        float: 'right',
        margin: 0,
    },
      
    HoursListlists: {
        float: 'left',
        width: '100%',
        textAlign: 'center',
        margin: 0,
        color: 'white',
        marginTop: '5px',
        marginBottom: '5px',
        zIndex: 999,
        fontSize: '1.25rem'
    },
      
    PLUS: {
        fontSize: '200%',
        color: 'orange',
    }
});

