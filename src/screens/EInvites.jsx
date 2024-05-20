import BDayCardPic from '../assets/images/Invites.jpeg';
import '../assets/css/bdaycard.css';

export default function EInvites() {
    return (
        <div id='bdaycard'>
            <div id='CardtoSave' className='mt-[3vh]'>
                <img id="bdayimg" src={BDayCardPic} alt="Rectangle Poster" height="100%" width="100%" />
                <div id='bdaydiv1' className='mt-[-17.75vh]'>
                    <input 
                        id='childnameinput'
                        className='inputs !w-[389px]'
                        type="text" 
                        name="ChildName" 
                        placeholder="Birthday Child's Name"
                    />
                    <input
                        style={{marginLeft: '211px'}}
                        id='locationinput'
                        className='inputs !w-[391px]'
                        type="text"
                        name="Location" 
                        placeholder="Location of Party"
                    />       
                </div>
                <div id="bdaydiv2" style={{marginTop: '-0.5vh'}}>
                    <input 
                        id='partytimeinput'
                        className='inputs !w-[389px]'
                        type="text" 
                        name="Party Time" 
                        placeholder="Party Date and Time"
                    />
                    <input
                        style={{marginLeft: '211px'}}
                        id='phonenumberinput' 
                        className='inputs !w-[391px]'
                        type="text"
                        name="Phone Number" 
                        placeholder="Phone #"
                    />           
                </div>
            </div>
        </div>
    )
}