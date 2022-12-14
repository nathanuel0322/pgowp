import React from 'react';
import '../assets/css/about.css';
import BackgroundImage from '../assets/images/Rectangle.jpg';
import Stylesheet from "reactjs-stylesheet";
import GamingContract from '../assets/files/GamingContract.pdf';

export default function About() {
  return (
    <div>
      <img style={Object.assign({}, aboutstyles.image, {opacity: 0.05,})} src={BackgroundImage} alt="Rectangle Poster" height="100%" width="100%" />
      <div style={aboutstyles.aboutsection}>
        <strong>
          <p className="family-owned">
            Prestigious Gaming on Wheels Plus is a new family-owned business. 
          </p>
          <br />
          <br />
          <p>
            We have two boys, currently 18 and 13 years old, who love gaming. As a
            family, we always believe once a child is doing well in school, then 
            why not let them have fun and enjoy what they love most? Our family
            knows what it takes for children to have fun. We cater to both boys and
            girls. We have 2 50" TV's outside with a 14' awning for all the girls'
            needs for Just Dance! There's ample space to dance. We are a very tech 
            savvy family, so we have the latest and the greatest systems!
          </p> 
          <br />
          <br />
          <p>
            We have a very prestigious game trailer that gives our players the
            utmost comfort & style. So, see for yourself by booking us today! Thank
            you!
          </p>
          <br />
          <br />
          <p>
            - 7 50" 4K TV's 
            <br />
            - 2 50" 4K TV's outside, along with a 14' awning & exterior heat
          </p>
          <br />
          <br />
          <p>
            <a href={GamingContract} download="Contract" style={{textDecoration: 'underline'}}>Click here to download and view our terms and conditions!</a>
          </p>
        </strong>
      </div>
    </div>
  );
}

const aboutstyles = Stylesheet.create({
  image: {
    marginTop: '5.5%',
  },

  aboutsection: {
    position: 'absolute',
    marginTop: '-75%',
    color: 'white',
    fontFamily: "'Playfair Display', serif",
    fontSize: '150%',
    textAlign: 'center',
    padding: '0rem 2rem',
  }
})