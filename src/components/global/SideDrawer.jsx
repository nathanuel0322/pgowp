import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import CloseIcon from '@mui/icons-material/Close';
import '../../assets/css/sidedrawer.css'
import { Link } from 'react-router-dom';
import { IconButton } from '@mui/material';
import Stylesheet from 'reactjs-stylesheet';

export default function SideDrawer({drawerstate, drawerfunc}) {
    const hamburgerstyles = Stylesheet.create({
        allelements: {
            textDecoration: 'none',
            color: 'white',
            fontFamily: "'Teko', sans-serif",
            fontSize: '1.25rem',
            fontWeight: 600,
            margin: '.667rem 1rem',
        },
        link: {
            letterSpacing: '0.025rem'
        },
        tabs: {
            paddingLeft: '4%',
            paddingTop: '2.5%',
            paddingBottom: '2.5%',
            width: '100%',
            listStyleType: 'none',
            color: '#1bc2ca',
            borderColor: '#1bc2ca',
            borderRadius: 40,
            padding: '.625rem 2rem',
            textAlign: 'center',
            border: '2px solid',
        }
    })
    return (
        <SwipeableDrawer
            anchor={'right'}
            open={drawerstate}
            onOpen={()=>{}}
            onClose={() => drawerfunc(false)}
        >
            <div>
                <div>
                    <IconButton onClick={() => drawerfunc(false)} sx={{justifyContent: 'flex-start'}}>
                        <CloseIcon fontSize='small' sx={{width: 1/4, height: 1/4, color: "white"}} />
                    </IconButton>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: "'Play', sans-serif", fontSize: 20, fontWeight: 600}}>
                    {['Home', 'Services', 'Packages', 'Game List', 'Gallery', 'E-Invites', 'Contact Us', 'About', 'Book Online'].map((text, index) => (
                        index === 8 ?
                            <li key={index} style={Object.assign({}, hamburgerstyles.allelements, hamburgerstyles.tabs, {listStyleType: 'none'})} onClick={() => drawerfunc(false)}>
                                <a target="_blank" rel="noopener noreferrer"
                                    href="https://app.10to8.com/book/ymonerhexbfwnegoml/" 
                                >
                                    Book Now
                                </a>
                            </li>
                        :
                            index === 4 ?
                                <li key={index} 
                                    style={Object.assign({}, hamburgerstyles.allelements, {listStyleType: 'none'})} 
                                    onClick={() => drawerfunc(false)}
                                >
                                    <a target="_blank" rel="noopener noreferrer"
                                        href="https://www.google.com/maps/place/Prestigious+Gaming+On+Wheels+Plus/@40.6717448,-73.7831725,3a,98y,90t/data=!3m8!1e2!3m6!1sAF1QipNxsYt_rIckjjQfRaQBWaA0pEgAJ_zCm3qYyVA!2e10!3e12!6shttps:%2F%2Flh5.googleusercontent.com%2Fp%2FAF1QipNxsYt_rIckjjQfRaQBWaA0pEgAJ_zCm3qYyVA%3Dw203-h114-k-no!7i800!8i450!4m7!3m6!1s0x89c267ef4ab3d5c7:0x77d90889fb9bc7fc!8m2!3d40.671612!4d-73.7834759!14m1!1BCgIgAQ#" 
                                    >
                                        Gallery
                                    </a>
                                </li>
                            :
                                <Link key={index} to={index === 0 ? '/' : `/${text.split(" ").join("").toLowerCase()}`} onClick={() => drawerfunc(false)}
                                    style={Object.assign({}, hamburgerstyles.allelements, hamburgerstyles.link)}
                                >
                                    {text}
                                </Link>
                    ))}
                </div>
            </div>
        </SwipeableDrawer>
    );
}