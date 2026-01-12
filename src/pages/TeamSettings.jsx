import React, { useState } from 'react';
import { useTeams } from '../context/TeamContext';
import './TeamSettings.css';

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
    <div className="team-settings-container">
      <div className="settings-header">
        <h1>Team Configuration</h1>
        <p>Customize team names and colors across the application</p>
      </div>

      <div className="settings-content">
        <div className="teams-grid">
          {Object.entries(teams).map(([teamId, team]) => (
            <div key={teamId} className="team-card">
              <div className="team-card-header" style={{ backgroundColor: team.color }}>
                <h3>{team.name}</h3>
              </div>
              <div className="team-card-body">
                <div className="form-group">
                  <label htmlFor={`name-${teamId}`}>Team Name</label>
                  <input
                    id={`name-${teamId}`}
                    type="text"
                    value={team.name}
                    onChange={(e) => handleNameChange(teamId, e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor={`color-${teamId}`}>Team Color</label>
                  <div className="color-input-group">
                    <input
                      id={`color-${teamId}`}
                      type="color"
                      value={team.color}
                      onChange={(e) => handleColorChange(teamId, e.target.value)}
                      className="color-picker"
                    />
                    <input
                      type="text"
                      value={team.color}
                      onChange={(e) => handleColorChange(teamId, e.target.value)}
                      className="color-text-input"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div className="color-preview" style={{ backgroundColor: team.color }}>
                  Preview
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="settings-actions">
          <button onClick={handleReset} className="reset-button">
            Reset to Defaults
          </button>
        </div>

        <div className="settings-info">
          <h3>ℹ️ Information</h3>
          <ul>
            <li>Changes are saved automatically</li>
            <li>Team colors and names will update across all pages</li>
            <li>Settings persist across browser sessions</li>
            <li>Use the reset button to restore default settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default TeamSettings;
