import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { TeamProvider } from './context/TeamContext';
import { EventProvider } from './context/EventContext';
import WeeklySchedule from './pages/WeeklySchedule';
import StoryPointing from './pages/StoryPointing';
import TeamSettings from './pages/TeamSettings';
import Home from './pages/Home';

function AppContent() {
  const location = useLocation();
  const isWeeklySchedule = location.pathname === '/weeklyschedule';
  
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md sticky top-0 z-[1000]">
        <div className="max-w-screen-xl mx-auto px-4 py-4 flex justify-between items-center flex-wrap">
          <Link to="/" className="text-xl font-bold text-white flex items-center gap-2 max-md:text-lg">
            🗓️ Patagonia
          </Link>
          <ul className="flex list-none gap-4 flex-wrap max-md:gap-2 max-md:w-full max-md:justify-center max-md:mt-2">
            <li>
              <Link to="/" className="text-white font-medium px-3 py-2 rounded hover:bg-white/20 transition-colors text-sm md:text-base block whitespace-nowrap max-md:px-2 max-md:py-1.5 max-md:text-xs">
                Home
              </Link>
            </li>
            <li>
              <Link to="/weeklyschedule" className="text-white font-medium px-3 py-2 rounded hover:bg-white/20 transition-colors text-sm md:text-base block whitespace-nowrap max-md:px-2 max-md:py-1.5 max-md:text-xs">
                Weekly Schedule
              </Link>
            </li>
            <li>
              <Link to="/storypointing" className="text-white font-medium px-3 py-2 rounded hover:bg-white/20 transition-colors text-sm md:text-base block whitespace-nowrap max-md:px-2 max-md:py-1.5 max-md:text-xs">
                Story Pointing
              </Link>
            </li>
            <li>
              <Link to="/teamsettings" className="text-white font-medium px-3 py-2 rounded hover:bg-white/20 transition-colors text-sm md:text-base block whitespace-nowrap max-md:px-2 max-md:py-1.5 max-md:text-xs">
                Team Settings
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      
      <main className={`max-w-screen-xl mx-auto ${isWeeklySchedule ? 'h-[calc(100vh-70px)] overflow-hidden p-1 max-md:h-[calc(100vh-100px)] max-md:p-1' : 'p-4 max-md:p-2'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/weeklyschedule" element={<WeeklySchedule />} />
          <Route path="/storypointing" element={<StoryPointing />} />
          <Route path="/teamsettings" element={<TeamSettings />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <TeamProvider>
      <EventProvider>
        <Router basename="/react-process-app">
          <AppContent />
        </Router>
      </EventProvider>
    </TeamProvider>
  );
}

export default App;
