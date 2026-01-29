import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, onSnapshot, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useTeams } from '../context/TeamContext';

const FIBONACCI = [1, 2, 3, 5, 8, 13, '?', '☕'];

function PlanningPoker() {
  const { teams } = useTeams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [currentSession, setCurrentSession] = useState(null);
  const [userName, setUserName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [votes, setVotes] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [ticketName, setTicketName] = useState('');

  // Check URL for session parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionParam = urlParams.get('session');
    if (sessionParam) {
      const decodedSession = decodeURIComponent(sessionParam);
      setSessionId(decodedSession);
      // Auto-load session to check if it exists
      checkAndLoadSession(decodedSession);
    }
  }, []);

  const checkAndLoadSession = async (sessionName) => {
    if (!db) return;
    
    try {
      const sessionDocRef = doc(db, 'poker-sessions', sessionName);
      const sessionSnap = await getDoc(sessionDocRef);
      
      if (sessionSnap.exists()) {
        setCurrentSession(sessionSnap.data());
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const teamArray = Object.values(teams || {}).sort((a, b) => {
    if (a.name === 'R&D Events') return 1;
    if (b.name === 'R&D Events') return -1;
    return a.name.localeCompare(b.name);
  }).filter(team => team.name !== 'R&D Events'); // Exclude R&D Events

  // Listen to current session
  useEffect(() => {
    if (!sessionId || !db) return;

    const unsubscribe = onSnapshot(doc(db, 'poker-sessions', sessionId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentSession(data);
        setShowResults(data.revealed || false);
        setTicketName(data.ticketName || '');
      } else {
        setCurrentSession(null);
        setShowResults(false);
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  // Listen to votes
  useEffect(() => {
    if (!sessionId || !db) return;

    const unsubscribe = onSnapshot(collection(db, 'poker-sessions', sessionId, 'votes'), (snapshot) => {
      const votesData = {};
      snapshot.forEach((doc) => {
        votesData[doc.id] = doc.data();
      });
      setVotes(votesData);
    });

    return () => unsubscribe();
  }, [sessionId]);

  const startSession = async () => {
    if (!sessionId.trim()) {
      alert('Please enter a session name');
      return;
    }

    try {
      await setDoc(doc(db, 'poker-sessions', sessionId), {
        createdAt: new Date().toISOString(),
        revealed: false,
        ticketName: '',
        team: selectedTeam
      });
      setIsAdmin(true);
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start session. Make sure Firebase is configured.');
    }
  };

  const joinSession = async () => {
    if (!sessionId.trim() || !userName.trim() || !selectedTeam) {
      alert('Please enter session name, your name, and select a team');
      return;
    }

    try {
      // Check if session exists
      const sessionDocRef = doc(db, 'poker-sessions', sessionId);
      const sessionSnap = await getDoc(sessionDocRef);

      if (!sessionSnap.exists()) {
        alert('Session not found. Please check the session name or ask the admin for the correct link.');
        return;
      }

      // Session found, set it as current
      setCurrentSession(sessionSnap.data());
    } catch (error) {
      console.error('Error joining session:', error);
      alert('Failed to join session. Make sure Firebase is configured.');
    }
  };

  const castVote = async (card) => {
    if (!userName.trim() || !selectedTeam) {
      alert('Please enter your name and select a team');
      return;
    }

    setSelectedCard(card);

    try {
      await setDoc(doc(db, 'poker-sessions', sessionId, 'votes', userName), {
        userName,
        team: selectedTeam,
        card: showResults ? card : '***',
        actualCard: card,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error casting vote:', error);
    }
  };

  const revealCards = async () => {
    try {
      await setDoc(doc(db, 'poker-sessions', sessionId), {
        ...currentSession,
        revealed: true
      });
    } catch (error) {
      console.error('Error revealing cards:', error);
    }
  };

  const resetVoting = async () => {
    try {
      // Delete all votes
      const votesToDelete = Object.keys(votes);
      await Promise.all(
        votesToDelete.map(voterId => deleteDoc(doc(db, 'poker-sessions', sessionId, 'votes', voterId)))
      );

      // Reset revealed state
      await setDoc(doc(db, 'poker-sessions', sessionId), {
        ...currentSession,
        revealed: false
      });

      setSelectedCard(null);
    } catch (error) {
      console.error('Error resetting votes:', error);
    }
  };

  const updateTicketName = async (name) => {
    try {
      await setDoc(doc(db, 'poker-sessions', sessionId), {
        ...currentSession,
        ticketName: name
      });
    } catch (error) {
      console.error('Error updating ticket name:', error);
    }
  };

  const endSession = async () => {
    if (window.confirm('Are you sure you want to end this session?')) {
      try {
        // Delete all votes
        const votesToDelete = Object.keys(votes);
        await Promise.all(
          votesToDelete.map(voterId => deleteDoc(doc(db, 'poker-sessions', sessionId, 'votes', voterId)))
        );

        // Delete session
        await deleteDoc(doc(db, 'poker-sessions', sessionId));

        // Reset state
        setSessionId('');
        setCurrentSession(null);
        setIsAdmin(false);
        setVotes({});
        setSelectedCard(null);
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }
  };

  const copySessionLink = () => {
    const sessionUrl = `${window.location.origin}${window.location.pathname}?session=${encodeURIComponent(sessionId)}`;
    navigator.clipboard.writeText(sessionUrl).then(() => {
      alert('Session link copied to clipboard! Share it with your team.');
    }).catch(err => {
      console.error('Failed to copy:', err);
      // Fallback: show the URL
      prompt('Copy this link:', sessionUrl);
    });
  };

  const calculateStats = () => {
    const validVotes = Object.values(votes)
      .filter(v => typeof v.actualCard === 'number')
      .map(v => v.actualCard);

    if (validVotes.length === 0) return null;

    const sum = validVotes.reduce((a, b) => a + b, 0);
    const avg = sum / validVotes.length;
    const sorted = [...validVotes].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const min = Math.min(...validVotes);
    const max = Math.max(...validVotes);

    return { avg: avg.toFixed(1), median, min, max, count: validVotes.length };
  };

  const stats = showResults ? calculateStats() : null;

  // Group votes by team
  const votesByTeam = Object.values(votes).reduce((acc, vote) => {
    const team = vote.team || 'Unknown';
    if (!acc[team]) acc[team] = [];
    acc[team].push(vote);
    return acc;
  }, {});

  // Show join form if session exists but user hasn't entered details yet
  if (currentSession && !isAdmin && (!userName || !selectedTeam)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-md:p-4">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2 max-md:text-2xl">Join Planning Poker</h1>
            <p className="text-gray-600 max-md:text-sm">Session: <strong>{sessionId}</strong></p>
          </div>

          <div className="mb-8">
            <label className="block mb-2 font-semibold text-gray-800 max-md:text-sm">Your Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors max-md:p-2 max-md:text-sm"
              autoFocus
            />
          </div>

          <div className="mb-8">
            <label className="block mb-2 font-semibold text-gray-800 max-md:text-sm">Select Your Team</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors max-md:p-2 max-md:text-sm"
            >
              <option value="">Choose a team...</option>
              {teamArray.map(team => (
                <option key={team.name} value={team.name}>{team.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              if (!userName.trim() || !selectedTeam) {
                alert('Please enter your name and select a team');
                return;
              }
              // User info is set, the main UI will now show
            }}
            disabled={!userName.trim() || !selectedTeam}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-4 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed max-md:py-3 max-md:text-sm"
          >
            👥 Join Session
          </button>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 max-md:text-sm">
            <p className="text-sm text-blue-800">
              <strong>Active Session Found!</strong> Enter your details above to start voting with your team.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentSession && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-md:p-4">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2 max-md:text-2xl">Planning Poker</h1>
            <p className="text-gray-600 max-md:text-sm">Collaborative estimation for agile teams</p>
          </div>

          <div className="mb-8">
            <label className="block mb-2 font-semibold text-gray-800 max-md:text-sm">Session Name</label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="e.g., Sprint-25-Planning"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors max-md:p-2 max-md:text-sm"
            />
          </div>

          <div className="mb-8">
            <label className="block mb-2 font-semibold text-gray-800 max-md:text-sm">Your Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors max-md:p-2 max-md:text-sm"
            />
          </div>

          <div className="mb-8">
            <label className="block mb-2 font-semibold text-gray-800 max-md:text-sm">Select Team</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors max-md:p-2 max-md:text-sm"
            >
              <option value="">Choose a team...</option>
              {teamArray.map(team => (
                <option key={team.name} value={team.name}>{team.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 max-md:flex-col">
            <button
              onClick={startSession}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-4 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 max-md:py-3 max-md:text-sm"
            >
              🎮 Start New Session (Admin)
            </button>
            <button
              onClick={joinSession}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-4 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 max-md:py-3 max-md:text-sm"
            >
              👥 Join Existing Session
            </button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200 max-md:text-sm">
            <p className="text-sm text-blue-800">
              <strong>How it works:</strong> Admin starts a session, team members join using the same session name.
              Everyone votes using Fibonacci cards (1, 2, 3, 5, 8, 13). Admin reveals all votes at once.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-4 max-md:p-4">
          <div className="flex justify-between items-start mb-4 max-md:flex-col max-md:gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2 max-md:text-xl">
                🎯 Planning Poker: <span className="text-indigo-600">{sessionId}</span>
              </h1>
              {isAdmin ? (
                <div className="flex items-center gap-2 max-md:flex-col max-md:items-start max-md:w-full">
                  <input
                    type="text"
                    value={ticketName}
                    onChange={(e) => updateTicketName(e.target.value)}
                    placeholder="Enter ticket/story name..."
                    className="flex-1 p-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 max-md:w-full max-md:text-sm"
                  />
                </div>
              ) : (
                ticketName && <p className="text-lg text-gray-600 max-md:text-sm">📝 {ticketName}</p>
              )}
            </div>
            <div className="flex gap-2 max-md:w-full max-md:flex-col">
              <button
                onClick={copySessionLink}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap max-md:text-sm"
              >
                🔗 Share Link
              </button>
              {isAdmin && (
                <>
                  {!showResults && Object.keys(votes).length > 0 && (
                    <button
                      onClick={revealCards}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap max-md:text-sm"
                    >
                      👁️ Reveal Cards
                    </button>
                  )}
                  {showResults && (
                    <button
                      onClick={resetVoting}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap max-md:text-sm"
                    >
                      🔄 New Vote
                    </button>
                  )}
                  <button
                    onClick={endSession}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap max-md:text-sm"
                  >
                    🛑 End Session
                  </button>
                </>
              )}
            </div>
          </div>

          {!isAdmin && (
            <div className="text-sm text-gray-600">
              <strong>You:</strong> {userName} ({selectedTeam})
            </div>
          )}
        </div>

        {/* Cards Selection */}
        {!isAdmin && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-4 max-md:p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4 max-md:text-lg">Select Your Estimate</h2>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3 max-md:gap-2">
              {FIBONACCI.map(value => (
                <button
                  key={value}
                  onClick={() => castVote(value)}
                  disabled={showResults}
                  className={`aspect-[2/3] rounded-xl text-3xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-1 max-md:text-2xl ${
                    selectedCard === value
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white scale-105'
                      : 'bg-white text-gray-800 border-2 border-gray-300 hover:border-indigo-500'
                  } ${showResults ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Voting Status */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-md:p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 max-md:text-lg">
              Participants ({Object.keys(votes).length})
            </h2>
            {showResults && stats && (
              <div className="flex gap-4 text-sm max-md:flex-col max-md:gap-1 max-md:items-end">
                <span className="font-semibold">📊 Avg: {stats.avg}</span>
                <span className="font-semibold">📈 Median: {stats.median}</span>
                <span className="text-gray-600">Min: {stats.min} | Max: {stats.max}</span>
              </div>
            )}
          </div>

          {Object.keys(votesByTeam).map(teamName => {
            const teamConfig = teamArray.find(t => t.name === teamName) || { name: teamName, color: '#999' };
            const teamVotes = votesByTeam[teamName];

            return (
              <div key={teamName} className="mb-6">
                <div 
                  className="flex items-center gap-2 mb-3 pb-2 border-b-2"
                  style={{ borderColor: teamConfig.color }}
                >
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: teamConfig.color }}
                  />
                  <h3 className="font-bold text-gray-800 max-md:text-sm">{teamName} ({teamVotes.length})</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-md:gap-2">
                  {teamVotes.map(vote => (
                    <div
                      key={vote.userName}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 border-2 border-gray-200 max-md:p-2"
                    >
                      <div className="text-sm font-semibold text-gray-700 text-center max-md:text-xs">
                        {vote.userName}
                      </div>
                      <div
                        className={`w-16 h-24 rounded-lg flex items-center justify-center text-2xl font-bold shadow-md max-md:w-12 max-md:h-18 max-md:text-xl ${
                          showResults
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        {showResults ? vote.actualCard : '🎴'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {Object.keys(votes).length === 0 && (
            <div className="text-center py-12 text-gray-500 max-md:py-8 max-md:text-sm">
              <div className="text-6xl mb-4 max-md:text-4xl">⏳</div>
              <p>Waiting for participants to vote...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlanningPoker;
