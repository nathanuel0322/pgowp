import React, {createContext, useState} from 'react';
import './assets/css/home.css';
import { Routes, Route } from "react-router-dom";
import { HashRouter as Router } from 'react-router-dom';
import Navbar from './components/global/Navbar';
import Home from './screens/Home';
import Services from './screens/Services';
import Gamelist from './screens/Gamelist';
import Contact from './screens/Contact';
import About from './screens/About';
import BDayCard from './screens/BDayCard';
import Packages from './screens/Packages';
import HamburgerNav from './components/global/HamburgerNav';
import { useMediaQuery } from 'react-responsive';
import SideDrawer from './components/global/SideDrawer';
import { Toaster } from 'react-hot-toast';
import EInvites from './screens/EInvites';

export const AppContext = createContext();

function App() {
  const hamburgerdetector = useMediaQuery({query: '(max-width: 991px)'});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentpage, setcurrentpage] = useState(null);
  
  return (
    <AppContext.Provider
      value={{
        currentpage,
        setcurrentpage
      }}
    >
      <div>
        <Router>
          {hamburgerdetector ? <HamburgerNav drawerfunc={setDrawerOpen} /> : <Navbar />}
          <SideDrawer drawerstate={drawerOpen} drawerfunc={setDrawerOpen} />
          <Routes>
            <Route exact path='' element={<Home />} />
            <Route exact path='/services' element={<Services />}/>
            <Route exact path='/packages' element={<Packages />} />
            <Route exact path='/gamelist' element={<Gamelist />} />
            <Route exact path='/contactus' element={<Contact />} />
            <Route exact path='/about' element={<About />} />
            <Route exact path='/e-invites' element={<EInvites />} />
            <Route exact path='/bdaycard' element={<BDayCard />} />
          </Routes>
        </Router>
        <Toaster />
      </div>
    </AppContext.Provider>
  )
}

export default App;