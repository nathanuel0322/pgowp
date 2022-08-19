import React from 'react';
import './assets/css/home.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from './components/global/Navbar';
import Home from './screens/Home';
import Services from './screens/Services';
import Gamelist from './screens/Gamelist';
import Contact from './screens/Contact';
import About from './screens/About';
import Packages from './screens/Packages';
import HamburgerNav from './components/global/HamburgerNav';
import { useMediaQuery } from 'react-responsive';

function App() {
  const hamburgerdetector = useMediaQuery({query: '(max-width: 767px)'});
  return (
    <Router>
      {hamburgerdetector ? <HamburgerNav /> : <Navbar />}
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/servicespage' element={<Services />}/>
        <Route path='/packagespage' element={<Packages />} />
        <Route path='/gamelistpage' element={<Gamelist />} />
        <Route path='/contactpage' element={<Contact />} />
        <Route path='/aboutpage' element={<About />} />
      </Routes>
    </Router>
  )
}

export default App;
