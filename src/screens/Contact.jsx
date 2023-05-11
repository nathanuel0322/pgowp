import React, { useState } from 'react';
import BackgroundImage from '../assets/images/Rectangle.jpg';
import '../assets/css/contact.css';
import emailjs from '@emailjs/browser';

export default function Contact(){
    const [hovering, setHovering] = useState(false);
    const [formfilled, setFormfilled] = useState(false);
    const sendEmail = (e) => {
        e.preventDefault();
        if (e.target[0].value === '' || e.target[1].value === '' || e.target[2].value === '') {
            alert('Please fill out all the fields');
            return;
        }
        else {
            const formbutton = document.getElementById("sendform");
            formbutton.disabled = true;
            formbutton.value = "Sending...";
            emailjs.sendForm('service_rb0yd56', 'template_879ls1m', '#contactme', 'dbCtiR00Etae1Fo2Q')
                .then((result) => {
                    setFormfilled(true);
                    console.log(result.text);
                }, (error) => {
                    console.log(error.text);
                });
        }
    };
    return(
        <div>
            <div id="overlay"></div>
            <div id="contactdiv">
                Click <a href="tel:718-496-1267" style={{color: 'darkturquoise', textDecoration: 'underline'}}>here</a> to call or 
                <span style={{color: 'darkturquoise'}}> email</span> us using the form below
                <br />
                {
                    formfilled ? 
                        <div className='formfilled' id="contactme">
                            <p style={{fontSize: '2.5rem'}}>Thank you for your message!</p>
                            <p style={{fontSize: '1.5rem'}}>We will get back to you as soon as possible.</p>
                        </div>
                    :
                        <form className='contactme' id='contactme' onSubmit={sendEmail}>
                            <p className="title">Get in touch</p>
                            <div className='nameemail'>
                                <input type="text" name="from_name" placeholder='Name*' className='neinputs' />
                                <input type="email" name="user_email" placeholder='Email*' className='neinputs' />
                            </div>
                            <textarea name="message" placeholder='Message*'></textarea>
                            <input type="email" value="tbnd@prestigiousgamingonwheelsplus.com" name='to_email' style={{display: 'none'}} />
                            <input type="submit" value="SEND" className='buttoncomp' id="sendform" 
                                style={{backgroundColor: hovering ? '#C38000' : '#FFBC00'}} onMouseOver={() => setHovering(true)} 
                                onMouseOut={() => setHovering(false)}
                            />
                        </form>
                }
            </div>
        </div>
    )
}