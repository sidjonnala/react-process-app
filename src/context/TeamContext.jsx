import React, { createContext, useContext, useState, useEffect } from 'react';

const TeamContext = createContext();

export const useTeams = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeams must be used within a TeamProvider');
  }
  return context;
};

const DEFAULT_TEAMS = {
  teamA: { name: 'Team A', color: '#4A90E2' },
  teamB: { name: 'Team B', color: '#E94B3C' },
  teamC: { name: 'Team C', color: '#50C878' },
  teamD: { name: 'Team D', color: '#9B59B6' }
};

const ALL_HANDS_CONFIG = {
  name: 'All Hands',
  color: '#95A5A6'
};

export const TeamProvider = ({ children }) => {
  const [teams, setTeams] = useState(() => {
    const savedTeams = localStorage.getItem('patagonia-teams');
    return savedTeams ? JSON.parse(savedTeams) : DEFAULT_TEAMS;
  });

  useEffect(() => {
    localStorage.setItem('patagonia-teams', JSON.stringify(teams));
  }, [teams]);

  const updateTeam = (teamId, updates) => {
    setTeams(prev => ({
      ...prev,
      [teamId]: { ...prev[teamId], ...updates }
    }));
  };

  const resetTeams = () => {
    setTeams(DEFAULT_TEAMS);
    localStorage.setItem('patagonia-teams', JSON.stringify(DEFAULT_TEAMS));
  };

  return (
    <TeamContext.Provider value={{ teams, updateTeam, resetTeams, allHands: ALL_HANDS_CONFIG }}>
      {children}
    </TeamContext.Provider>
  );
};
