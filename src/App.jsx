import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { TeamProvider } from './context/TeamContext';
import WeeklySchedule from './pages/WeeklySchedule';
import StoryPointing from './pages/StoryPointing';
import TeamSettings from './pages/TeamSettings';
import Home from './pages/Home';
import './App.css';

function App() {
  return (
    <TeamProvider>
      <Router>
        <div className="app">
          <nav className="navbar">
            <div className="nav-container">
              <Link to="/" className="nav-logo">
                🗓️ Patagonia
              </Link>
              <ul className="nav-menu">
                <li className="nav-item">
                  <Link to="/" className="nav-link">Home</Link>
                </li>
                <li className="nav-item">
                  <Link to="/weeklyschedule" className="nav-link">Weekly Schedule</Link>
                </li>
                <li className="nav-item">
                  <Link to="/storypointing" className="nav-link">Story Pointing</Link>
                </li>
                <li className="nav-item">
                  <Link to="/teamsettings" className="nav-link">Team Settings</Link>
                </li>
              </ul>
            </div>
          </nav>
          
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/weeklyschedule" element={<WeeklySchedule />} />
              <Route path="/storypointing" element={<StoryPointing />} />
              <Route path="/teamsettings" element={<TeamSettings />} />
            </Routes>
          </main>
        </div>
      </Router>
    </TeamProvider>
  );
}

export default App;
