import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TeamProvider } from './context/TeamContext';
import { EventProvider } from './context/EventContext';
import WeeklySchedule from './pages/WeeklySchedule';
import StoryPointing from './pages/StoryPointing';
import TeamSettings from './pages/TeamSettings';
import AdminPanel from './pages/AdminPanel';
import PlanningPoker from './pages/PlanningPoker';
import Home from './pages/Home';
import Login from './components/Login';
import PendingApproval from './components/PendingApproval';

function AppContent() {
  const location = useLocation();
  const { user, userProfile, signOut, loading } = useAuth();
  const isWeeklySchedule = location.pathname === '/weeklyschedule';
  const isAdmin = userProfile?.isAdmin === true;

  // TEMPORARY: Skip authentication
  const SKIP_AUTH = true;

  if (!SKIP_AUTH) {
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🗓️</div>
            <div className="text-xl text-gray-600">Loading...</div>
          </div>
        </div>
      );
    }

    if (!user) {
      return <Login />;
    }

    // Show pending approval screen for non-approved users (except admin)
    if (!isAdmin && userProfile && !userProfile.approved) {
      return <PendingApproval />;
    }
  }
  
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
            {/* TEMPORARY: Hide admin link
            {isAdmin && (
              <li>
                <Link to="/admin" className="text-white font-medium px-3 py-2 rounded hover:bg-white/20 transition-colors text-sm md:text-base block whitespace-nowrap max-md:px-2 max-md:py-1.5 max-md:text-xs">
                  👤 Admin
                </Link>
              </li>
            )}
            */}
            {/* TEMPORARY: Hide sign out button
            <li>
              <button 
                onClick={signOut}
                className="text-white font-medium px-3 py-2 rounded hover:bg-white/20 transition-colors text-sm md:text-base block whitespace-nowrap max-md:px-2 max-md:py-1.5 max-md:text-xs"
              >
                Sign Out
              </button>
            </li>
            */}
          </ul>
        </div>
      </nav>
      
      <main className={`max-w-screen-xl mx-auto ${isWeeklySchedule ? 'h-[calc(100vh-70px)] overflow-hidden p-1 max-md:h-[calc(100vh-100px)] max-md:p-1' : 'p-4 max-md:p-2'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/weeklyschedule" element={<WeeklySchedule />} />
          <Route path="/storypointing" element={<StoryPointing />} />
          <Route path="/planningpoker" element={<PlanningPoker />} />
          <Route path="/teamsettings" element={<TeamSettings />} />
          {/* TEMPORARY: Keep admin route but hidden from nav */}
          <Route path="/admin" element={isAdmin ? <AdminPanel /> : <Home />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <TeamProvider>
        <EventProvider>
          <Router basename="/react-process-app">
            <AppContent />
          </Router>
        </EventProvider>
      </TeamProvider>
    </AuthProvider>
  );
}

export default App;
