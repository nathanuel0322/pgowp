import React, { useEffect, useRef } from 'react';
import '../assets/css/home.css';
import PrestigiousPoster from '../assets/images/PrestigiousPoster.jpg';
import Typed from "typed.js";
import ReviewWidget from '../components/home/reviewwidget';

export default function Home(){
  // Create reference to store the DOM element containing the animation
  const el = useRef(null);
  
  // Create reference to store the Typed instance itself
  const typed = useRef(null);
    
  useEffect(() => {
    const options = {
        strings: [
          'Voted Best Game Truck in NY!'
        ],
        typeSpeed: 45,
        backSpeed: 45,
        loop: true,
    };

    // elRef refers to the <span> rendered below
    typed.current = new Typed(el.current, options);
    
    return () => {
        // Make sure to destroy Typed instance during cleanup
        // to prevent memory leaks
        typed.current.destroy();
    }
  }, []);

  return(
    <div id="homeouterdiv">
      <img src={PrestigiousPoster} className='poster' alt="Prestigious Poster" />
      <div className="wp">
        <p id="titlediv" className='text-5xl font-extrabold drop-shadow-2xl shadow-orange-700'>
          PRESTIGIOUS GAMING ON WHEELS PLUS!
        </p>
        <div id='outertyped'>
          <span id='typedvote' className='blinkingorange' ref={el} />
        </div>
        <p className='blinkinggreen'>
          Gaming Tournaments! 🎮
        </p>
        <p>
          Hey! Hi There! You found us!
          <br />
          We are the best gaming/movie trailer experience you will ever encounter from luxurious quality to the best
          sounding game/movie trailer on wheels. 
        </p>
      </div>
      <div id="outerytdiv">
        <div>
          <div>
            <iframe title='Youtube' id="youtube" width="100%" height="50%" src="https://www.youtube.com/embed/SvnDdaO3NkE"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
          </div>
        </div> 
      </div>
      <p id="quote">
        This is one game trailer you won’t forget. Up to 28 players at once. Don’t worry, we bring the party to you!
        Party in any weather, <span className="rain"> rain </span> or <span className="shine"> shine</span>
      ,<span id="Hot"> hot </span>
        or 
      <span id="cold"> cold</span>
      . Come and enjoy your party in our 
          
      <span id="yuh"> luxury class </span>
        trailer. 
      </p>
      <br />
      <p id="announce">
        We now have the new <span className="blinkingblue"><strong> Playstation 5 </strong></span>
          and the 
        <span className="blinkinggreen">
            <strong> Xbox Series X </strong>
        </span>
        !!!
      </p>
      <br />
      <p id="locations">
        We're available to come to you in 
        <span id="brooklyn"> Brooklyn! </span>
        <span id="queens"> Queens!</span>
        <span id="longisland"> Long Island! (Extra $125 if in Suffolk County)</span>
        <span id="manhattan"> Manhattan! (Extra $100!)</span>
        <span style={{color: '#F44336'}}> Staten Island! (Extra $200)</span>
        <span id="Bronx"> and Parts of the Bronx!</span>
        <br />
        Make sure at least 5 car spaces are saved for trailer parking!
        <br />
        Please note: if parking is not available with 30 minutes, you will lose your deposit and your party will be canceled.
        <br />
        For parties in <span id='NJ'>New Jersey</span>, click <a id='triplea' href="https://www.tripleamobilegaming.com/" target="_blank" rel="noreferrer">here</a> to check out our sister company, TripleA.
      </p>
      <br />
      <p id="occasions">
        We do 
        <span id="parties"> Birthday Parties! </span>
        <span id="church"> Church Functions! </span>
        <span id="schools"> School Events! </span>
        <span id="fundraiser"> Fundraisers! </span>
        <span id="Bar"> Bar Mitzvahs!</span>
        <span id="BatMitz"> Bat Mitzvahs!</span>
        <span id="Prom"> Prom!</span>
        <span id="block"> Block Parties! </span>
        <span id="Charities"> Charities! </span> and More!
        <br />
        <a className="Call" href="tel:7186738529" style={{color: 'chartreuse', textDecoration: 'underline'}}>Click here to call for events!</a>
      </p>
      <ReviewWidget />
      {/* <div className="10to8-ratings-widget" data-uuid="acc2fe13-9501-4e4b-bf95-de28c1e9324a">
        <a href="https://app.10to8.com/book/acc2fe13-9501-4e4b-bf95-de28c1e9324a/uuid/" target="_blank" rel="noreferrer">Powered by 10to8</a>
      </div> */}
      {/* <div className='mt-20 text-center w-100'>
      </div> */}
    </div> 
  )
}