import React, { useState, useEffect } from 'react';
import { useTeams } from '../context/TeamContext';
import DynamicCalendar from '../components/DynamicCalendar';

function WeeklySchedule() {
  const { teams } = useTeams();
  const [selectedTeams, setSelectedTeams] = useState([]);

  // Initialize with all teams selected
  useEffect(() => {
    // teams is an object, not an array - convert to array
    const teamArray = Object.values(teams || {});
    if (teamArray.length > 0) {
      setSelectedTeams(teamArray.map(t => t.name));
    }
  }, [teams]);

  const toggleTeam = (teamName) => {
    setSelectedTeams(prev => 
      prev.includes(teamName)
        ? prev.filter(t => t !== teamName)
        : [...prev, teamName]
    );
  };

  const selectAll = () => {
    const teamArray = Object.values(teams || {});
    setSelectedTeams(teamArray.map(t => t.name));
  };

  const deselectAll = () => {
    setSelectedTeams([]);
  };

  // Convert teams object to array for rendering and sort alphabetically
  const teamArray = Object.values(teams || {}).sort((a, b) => {
    // R&D Events always goes last
    if (a.name === 'R&D Events') return 1;
    if (b.name === 'R&D Events') return -1;
    // Otherwise alphabetical
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="h-full flex flex-col">
      <div className="text-center mb-2 max-md:mb-1">
        <h1 className="text-2xl font-bold text-gray-800 mb-1 max-md:text-lg">Sprint Cycle Calendar (2 Weeks)</h1>
        <p className="text-sm text-gray-600 max-md:text-xs">Drag and drop events to reschedule, double-click to add new events</p>
      </div>

      {/* Team Filter */}
      <div className="bg-white rounded-lg shadow-md p-3 mb-2 max-md:p-2 max-md:mb-1">
        <div className="flex items-center justify-between gap-2 mb-2 max-md:flex-col max-md:items-start">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700 text-sm max-md:text-xs">Filter by Team:</span>
            <button
              onClick={selectAll}
              className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="text-xs text-gray-500 max-md:hidden">
            {selectedTeams.length} of {teamArray.length} teams selected
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 max-md:gap-1">
          {teamArray.map(team => (
            <button
              key={team.name}
              onClick={() => toggleTeam(team.name)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 max-md:px-2 max-md:py-1 max-md:text-xs ${
                selectedTeams.includes(team.name)
                  ? 'shadow-md scale-105'
                  : 'opacity-50 hover:opacity-75'
              }`}
              style={{
                backgroundColor: selectedTeams.includes(team.name) ? team.color : '#e5e7eb',
                color: selectedTeams.includes(team.name) ? '#fff' : '#6b7280'
              }}
            >
              {team.name}
            </button>
          ))}
        </div>
      </div>

      <DynamicCalendar selectedTeams={selectedTeams} />
    </div>
  );
}

export default WeeklySchedule;
