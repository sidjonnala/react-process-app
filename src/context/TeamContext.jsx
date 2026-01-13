import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

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
  teamD: { name: 'Team D', color: '#9B59B6' },
  rndEvents: { name: 'R&D Events', color: '#95A5A6' }
};

export const TeamProvider = ({ children }) => {
  const [teams, setTeams] = useState(() => {
    const savedTeams = localStorage.getItem('patagonia-teams');
    if (savedTeams) {
      const parsed = JSON.parse(savedTeams);
      // Check if it has the old allHands entry and remove it
      if (parsed.allHands) {
        delete parsed.allHands;
      }
      // Add rndEvents if it doesn't exist
      if (!parsed.rndEvents) {
        parsed.rndEvents = DEFAULT_TEAMS.rndEvents;
      }
      localStorage.setItem('patagonia-teams', JSON.stringify(parsed));
      return parsed;
    }
    return DEFAULT_TEAMS;
  });
  const [useFirebase, setUseFirebase] = useState(false);

  // Try to initialize Firebase connection
  useEffect(() => {
    const checkFirebase = async () => {
      try {
        if (db) {
          setUseFirebase(true);
          console.log('✅ Firebase connected for teams');
        }
      } catch (error) {
        console.log('📦 Using localStorage for teams');
        setUseFirebase(false);
      }
    };
    checkFirebase();
  }, []);

  // Subscribe to Firebase changes
  useEffect(() => {
    if (!useFirebase) return;

    const unsubscribe = onSnapshot(doc(db, 'config', 'teams'), (doc) => {
      if (doc.exists()) {
        const firebaseTeams = doc.data();
        setTeams(firebaseTeams);
        localStorage.setItem('patagonia-teams', JSON.stringify(firebaseTeams));
      }
    }, (error) => {
      console.error('Firebase teams sync error:', error);
      setUseFirebase(false);
    });

    return () => unsubscribe();
  }, [useFirebase]);

  // Fallback: Save to localStorage if Firebase not enabled
  useEffect(() => {
    if (!useFirebase) {
      localStorage.setItem('patagonia-teams', JSON.stringify(teams));
    }
  }, [teams, useFirebase]);

  const updateTeam = async (teamId, updates) => {
    const updatedTeams = {
      ...teams,
      [teamId]: { ...teams[teamId], ...updates }
    };

    if (useFirebase) {
      try {
        await setDoc(doc(db, 'config', 'teams'), updatedTeams);
      } catch (error) {
        console.error('Error updating team in Firebase:', error);
        setTeams(updatedTeams);
      }
    } else {
      setTeams(updatedTeams);
    }
  };

  const resetTeams = async () => {
    if (useFirebase) {
      try {
        await setDoc(doc(db, 'config', 'teams'), DEFAULT_TEAMS);
      } catch (error) {
        console.error('Error resetting teams in Firebase:', error);
        setTeams(DEFAULT_TEAMS);
        localStorage.setItem('patagonia-teams', JSON.stringify(DEFAULT_TEAMS));
      }
    } else {
      setTeams(DEFAULT_TEAMS);
      localStorage.setItem('patagonia-teams', JSON.stringify(DEFAULT_TEAMS));
    }
  };

  return (
    <TeamContext.Provider value={{ teams, updateTeam, resetTeams, useFirebase }}>
      {children}
    </TeamContext.Provider>
  );
};
