import React from 'react';
import '../assets/css/home.css';
import PrestigiousPoster from '../assets/images/PrestigiousPoster.jpg';
import { GetRequest } from '../components/home/reviewwidget';
import { useMediaQuery } from 'react-responsive';
import Stylesheet from 'reactjs-stylesheet';

export default function Home(){
  const mobile = useMediaQuery({query: '(min-width: 320px)'});
  const laptopsize = useMediaQuery({query: '(min-width: 1024px)'});
  const tablet = useMediaQuery({query: '(min-width: 768px)'});
  return(
    <div style={{backgroundColor: '#03396c'}}>
      <img src={PrestigiousPoster} style={{display: tablet ? 'block' : 'none', marginTop: laptopsize ? '7.5%' : tablet && '9%'}} alt="Prestigious Poster" />
      <div className="wp" style={{marginTop: tablet ? '3%' : mobile && '5%',}}>
        <p className='text-5xl font-extrabold drop-shadow-2xl shadow-orange-700' 
          style={{
            fontFamily: "'Teko', sans-serif",
            width: '100%', 
            textAlign: 'center', 
            color: '#ff8c00',
            fontSize: !tablet ? '7vw' : '4vw',
          }}
        >
          PRESTIGIOUS GAMING ON WHEELS PLUS!
        </p>
        <p className='blinkingorange' style={{color: '#FF5722', textAlign: 'center',fontFamily: "Teko, sans-serif", fontSize: tablet ? '4vw' : '6vw', marginTop: '2%'}}>
          Voted Best Game Truck in NY!
        </p>
        <p className='a2 mt-1 text-white' style={{fontSize: !tablet ? '6vw' : '3vw'}}>
          Hey! Hi There! You found us!
          <br />
          We are the best gaming/movie trailer experience you will ever encounter from luxurious quality to the best
          sounding game/movie trailer on wheels. 
        </p>
      </div>
      <div style={{width: '75%', margin: '0 auto', padding: '20px 0', textAlign:'center'}}>
        <div style={{width: '100%', display: 'inline-block',}}>
          <div style={{position: 'relative', width:'100%', height:0, paddingBottom:'80%', display:'inline-block', boxSizing:'border-box',}}>
            <iframe style={{position: 'absolute', backgroundColor: '#03396c',}} title='Youtube' id="youtube" width="100%" height="50%" 
            src="https://www.youtube.com/embed/SvnDdaO3NkE" frameborder="0" 
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        </div> 
      </div>
      <p id="quote" style={Object.assign({}, homestyles.text, {fontSize: tablet ? '3vw' : '6vw', fontFamily: "'Teko', sans-serif", color: 'white'})}>
        This is one game trailer you won’t forget. Up to 28 players at once. Don’t worry, we bring the party to <span className="quo"> you! </span>
        Party in any weather, <span className="rain"> rain </span> or <span class="shine"> shine </span>
      ,<span id="Hot"> Hot </span>
        or 
      <span id="cold"> Cold </span>
      . Come and enjoy your party in our 
          
      <span class="quo" id="yuh"> luxury class </span>
        trailer. 
      </p>
      <br />
      <p id="announce" style={Object.assign({}, homestyles.text, {fontSize: tablet ? '3vw' : '6vw', textAlign: 'center', color: 'white'})}>
        We now have the new <span class="blinkingblue"><strong> Playstation 5 </strong></span>
          and the 
        <span class="blinkinggreen">
            <strong> Xbox Series X </strong>
        </span>
        !!!
      </p>
      <br />
      <p id="locations" style={Object.assign({}, homestyles.text, {fontSize: tablet ? '3vw' : '6vw', textAlign: 'center', color: 'white'})}>
        We're available to come to you in 
        <span id="brooklyn"> Brooklyn! </span>
        <span id="queens"> Queens!</span>
        <span id="longisland"> Long Island! (Extra $125 if in Suffolk County)</span>
        <span id="manhattan"> Manhattan! (Extra $100!)</span>
        <span style={{color: '#F44336'}}> Staten Island! (Extra $200)</span>
        <span id="NJ"> Parts of New Jersey! (Extra $200!)</span>
        <span id="Bronx"> and Parts of the Bronx!</span>
        <br />
        Make sure at least 5 car spaces are saved for trailer parking!
      </p>
      <br />
      <p id="occasions" style={{fontSize: tablet ? '3vw' : '6vw'}}>
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
        <a class="Call" href="tel:7186738529">Call for events!</a>
      </p>
      {/* <div className='mt-20 text-center w-100'>
        <GetRequest />
      </div> */}
    </div> 
  )
}

const homestyles = Stylesheet.create({
  text: {
    fontSize: '5vw',
  }
})
