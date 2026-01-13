import React, { useState } from 'react';
import { useTeams } from '../context/TeamContext';

function TeamSettings() {
  const { teams, updateTeam, resetTeams } = useTeams();
  const [editingTeam, setEditingTeam] = useState(null);

  const handleNameChange = (teamId, newName) => {
    updateTeam(teamId, { name: newName });
  };

  const handleColorChange = (teamId, newColor) => {
    updateTeam(teamId, { color: newColor });
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all teams to default settings?')) {
      resetTeams();
      setEditingTeam(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8 p-8 bg-white rounded-xl shadow-md">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Team Configuration</h1>
        <p className="text-lg text-gray-600">Customize team names and colors across the application</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {Object.entries(teams).map(([teamId, team]) => (
            <div key={teamId} className="bg-white rounded-xl overflow-hidden shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-200">
              <div className="p-6 text-white text-center" style={{ backgroundColor: team.color }}>
                <h3 className="m-0 text-2xl font-semibold">{team.name}</h3>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <label htmlFor={`name-${teamId}`} className="block mb-2 font-semibold text-gray-800">Team Name</label>
                  <input
                    id={`name-${teamId}`}
                    type="text"
                    value={team.name}
                    onChange={(e) => handleNameChange(teamId, e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 rounded-md text-base focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor={`color-${teamId}`} className="block mb-2 font-semibold text-gray-800">Team Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      id={`color-${teamId}`}
                      type="color"
                      value={team.color}
                      onChange={(e) => handleColorChange(teamId, e.target.value)}
                      className="w-[60px] h-[45px] border-2 border-gray-300 rounded-md cursor-pointer"
                    />
                    <input
                      type="text"
                      value={team.color}
                      onChange={(e) => handleColorChange(teamId, e.target.value)}
                      className="flex-1 p-3 border-2 border-gray-300 rounded-md text-base font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div className="p-4 text-center text-white font-bold rounded-md mt-4 shadow-[1px_1px_2px_rgba(0,0,0,0.5)]" style={{ backgroundColor: team.color }}>
                  Preview
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center py-8 border-t-2 border-b-2 border-gray-300 my-8">
          <button 
            onClick={handleReset} 
            className="px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-red-500 to-red-700 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            Reset to Defaults
          </button>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mt-8">
          <h3 className="text-gray-800 mb-4 text-xl font-semibold">ℹ️ Information</h3>
          <ul className="list-none p-0">
            <li className="py-2 text-gray-600 relative pl-6 before:content-['✓'] before:text-emerald-500 before:absolute before:left-0 before:font-bold">
              Changes are saved automatically
            </li>
            <li className="py-2 text-gray-600 relative pl-6 before:content-['✓'] before:text-emerald-500 before:absolute before:left-0 before:font-bold">
              Team colors and names will update across all pages
            </li>
            <li className="py-2 text-gray-600 relative pl-6 before:content-['✓'] before:text-emerald-500 before:absolute before:left-0 before:font-bold">
              Settings persist across browser sessions
            </li>
            <li className="py-2 text-gray-600 relative pl-6 before:content-['✓'] before:text-emerald-500 before:absolute before:left-0 before:font-bold">
              Use the reset button to restore default settings
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default TeamSettings;
