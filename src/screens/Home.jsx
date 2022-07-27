import React from 'react';
import '../assets/css/home.css';
import PrestigiousPoster from '../assets/images/PrestigiousPoster.jpg';
import { GetRequest } from '../components/home/reviewwidget';

export default function Home(){
    return(
      <div className='relative'>
        <img src={PrestigiousPoster} alt="Prestigious Poster" className='bckgrnd'/>
        {/* <div className="wp">
          <p 
            className='text-5xl font-extrabold drop-shadow-2xl shadow-orange-700' 
            style={{
              fontFamily: "'Teko', sans-serif",
              width: '100%', 
              textAlign: 'center', 
              marginTop: 100,
              color: '#ff8c00',
            }}
          >
            PRESTIGIOUS GAMING ON WHEELS PLUS!
          </p>
          <p 
            className='a2 text-3xl mt-5 text-blue-700'
          >
            Hey! Hi There! You found us!
            <br />
            We are the best gaming/movie trailer experience you will ever encounter from luxurious quality to the best
            sounding game/movie trailer on wheels. 
          </p>
        </div> */}
        <div className='mt-20 text-center w-100'>
          <GetRequest />
        </div>
      </div> 
    )
}

