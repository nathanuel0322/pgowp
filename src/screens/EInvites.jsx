import BDayCardPic from '../assets/images/Invites.jpeg';
import '../assets/css/bdaycard.css';

export default function EInvites() {
    return (
        <div id='bdaycard'>
            <div id='CardtoSave' className='mt-[3vh]'>
                <img id="bdayimg" src={BDayCardPic} alt="Rectangle Poster" height="100%" width="100%" />
                <div id='bdaydiv1' style={{marginTop: '-13.75vw'}}>
                    <form>
                        <label>
                            <input 
                                id='childnameinput'
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
                                id='locationinput'
                                className='inputs'
                                type="text"
                                name="Location" 
                                placeholder="Location of Party"
                            />
                        </label>
                    </form>            
                </div>
                <div id="bdaydiv2" style={{marginTop: '-4vw'}}>
                    <form>
                        <label>
                            <input 
                                id='partytimeinput'
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
                                id='phonenumberinput' 
                                className='inputs'
                                type="text"
                                name="Phone Number" 
                                placeholder="Phone #"
                            />
                        </label>
                    </form>            
                </div>
            </div>
        </div>
    )
}