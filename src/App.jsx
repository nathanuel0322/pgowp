import React from 'react';
import './assets/css/home.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from './components/global/Navbar';
import Home from './screens/Home';
import Services from './screens/Services';
import Gamelist from './screens/Gamelist';
import Contact from './screens/Contact';
import About from './screens/About';
console.log('New run')

function App() {
  return (
    <Router>
    <Navbar />
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/servicespage' element={<Services />}/>
      <Route path='/gamelistpage' element={<Gamelist />} />
      <Route path='/contactpage' element={<Contact />} />
      <Route path='/aboutpage' element={<About />} />
    </Routes>
  </Router>
  )
}

export default App;
