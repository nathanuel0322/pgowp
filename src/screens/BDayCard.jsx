import React, { useState, useEffect } from 'react';
import BDayCardPic from '../assets/images/Invites.jpeg';
import html2canvas from 'html2canvas';
import { useMediaQuery } from 'react-responsive';
import '../assets/css/bdaycard.css';
import toast from 'react-hot-toast';

export default function BDayCard() {
    const changetextvw435 = useMediaQuery({query: '(max-width: 435px)'});
    const changetextvw400 = useMediaQuery({query: '(max-width: 400px)'});
    const changetextvw350 = useMediaQuery({query: '(max-width: 350px)'});
    const [topdivmargin, settopdivmargin] = useState(!changetextvw435 ? '-14vw' : changetextvw400 ? (changetextvw350 ? '-14.5vw' : '-14vw')  : '-13.5vw')
    const [topdivchanged, settopdivchanged] = useState(null);

    useEffect(() => {
        // console.log("topdivchanged: ", topdivchanged)
        if (topdivchanged) {
            exportAsImage();
            // if (!firstRender.current) {
            //     console.log("Exporting as image");
            // } else {
            //     firstRender.current = false;
            // }
        }
    }, [topdivchanged])

    const handleSubmit = (event) => {
        event.preventDefault();
    }

    const exportAsImage = async () => {
        const canvas = await html2canvas(document.getElementById('CardtoSave'), {scale: 10});
        canvas.toBlob(async (blob) => {
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');

            // Release the reference to the blob
            URL.revokeObjectURL(url);
        });
        settopdivmargin(!changetextvw435 ? '-14vw' : changetextvw400 ? (changetextvw350 ? '-14.5vw' : '-14vw')  : '-13.5vw');
        settopdivchanged(null);
    }

  return (
    <div id='bdaycard'>
        <div id='CardtoSave'>
            <img id="bdayimg" src={BDayCardPic} alt="Rectangle Poster" height="100%" width="100%" />
            <div id='bdaydiv1' style={{marginTop: topdivmargin}}>
                <form onSubmit={handleSubmit}>
                    <label>
                        <input 
                            className='inputs'
                            type="text" 
                            name="ChildName" 
                            placeholder="Birthday Child's Name"
                        />
                    </label>
                </form>
                <form style={{marginLeft: '24%'}}>
                    <label>
                        <input 
                            className='inputs'
                            type="text"
                            name="Location" 
                            placeholder="Location of Party"
                        />
                    </label>
                </form>            
            </div>
            <div id="bdaydiv2" style={{marginTop: !changetextvw435 ? '-3.5vw' : changetextvw400 ? (changetextvw350 ? '-4vw' : '-3.5vw')  : '-3.5vw'}}>
                <form onSubmit={handleSubmit}>
                    <label>
                        <input 
                            className='inputs'
                            type="text" 
                            name="Party Time" 
                            placeholder="Party Time"
                        />
                    </label>
                </form>
                <form style={{marginLeft: '24%'}}>
                    <label>
                        <input 
                            className='inputs'
                            type="text"
                            name="Phone Number" 
                            placeholder="Phone #"
                        />
                    </label>
                </form>            
            </div>
        </div>
        <div id='bdaybuttondiv'>
                <input type="submit" value='Save Image' id='bdaybutton' className='cursor-pointer'
                    onClick={async() => {
                        toast("Allow a few seconds for the image to download", {
                            icon: '📸',
                            style: {
                                borderRadius: '10px',
                                background: '#333',
                                color: '#fff',
                                fontSize: '18px',
                            },
                        });
                        // MUST FIX TOP DIV MARGIN FOR LARGE SCREENS LATER ON
                        settopdivmargin(!changetextvw435 ? '-14vw' : changetextvw400 ? (changetextvw350 ? '-16.5vw' : '-15vw')  : '-14vw');
                        settopdivchanged(true);
                        console.log("Export called");
                    }}
                />
        </div>
        <div id='bdaydisclaimer'>
            If you need to make any changes after saving image, reload the page first!!!
        </div>
    </div>
  )
}