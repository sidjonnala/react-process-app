import React, { createContext, useContext, useState, useEffect } from 'react';

const EventContext = createContext();

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};

const DEFAULT_EVENTS = [
  // Week 1 - Sprint Start with Retros (Monday)
  { id: 1, teamId: 'teamA', title: 'Retro', dayIndex: 0, startTime: 8.0, duration: 0.5, frequency: 'Bi-weekly' },
  { id: 2, teamId: 'teamB', title: 'Retro', dayIndex: 0, startTime: 8.5, duration: 0.5, frequency: 'Bi-weekly' },
  { id: 3, teamId: 'teamC', title: 'Retro', dayIndex: 0, startTime: 9.0, duration: 0.5, frequency: 'Bi-weekly' },
  { id: 4, teamId: 'teamD', title: 'Retro', dayIndex: 0, startTime: 9.5, duration: 0.5, frequency: 'Bi-weekly' },
  
  // Week 1 - Tuesday (No Scrums - All Hands only)
  { id: 5, teamId: 'rndEvents', title: 'All Hands Meeting', dayIndex: 1, startTime: 9.0, duration: 2.0, frequency: 'Weekly' },
  
  // Week 1 - Wednesday (Grooming for A & B, Scrums for C & D at 7:30 & 7:45)
  { id: 103, teamId: 'teamC', title: 'Daily Scrum', dayIndex: 2, startTime: 7.5, duration: 0.25, frequency: 'Daily' },
  { id: 104, teamId: 'teamD', title: 'Daily Scrum', dayIndex: 2, startTime: 7.75, duration: 0.25, frequency: 'Daily' },
  { id: 6, teamId: 'teamA', title: 'Grooming + Estimation', dayIndex: 2, startTime: 8.0, duration: 1.0, frequency: 'Weekly' },
  { id: 7, teamId: 'teamB', title: 'Grooming + Estimation', dayIndex: 2, startTime: 9.0, duration: 1.0, frequency: 'Weekly' },
  
  // Week 1 - Thursday (Grooming for C & D, Scrums for A & B)
  { id: 8, teamId: 'teamC', title: 'Grooming + Estimation', dayIndex: 3, startTime: 7.5, duration: 1.0, frequency: 'Weekly' },
  { id: 9, teamId: 'teamD', title: 'Grooming + Estimation', dayIndex: 3, startTime: 8.5, duration: 1.0, frequency: 'Weekly' },
  { id: 105, teamId: 'teamA', title: 'Daily Scrum', dayIndex: 3, startTime: 9.5, duration: 0.25, frequency: 'Daily' },
  { id: 106, teamId: 'teamB', title: 'Daily Scrum', dayIndex: 3, startTime: 9.75, duration: 0.25, frequency: 'Daily' },
  
  // Week 1 - Friday (All teams have Scrums)
  { id: 107, teamId: 'teamA', title: 'Daily Scrum', dayIndex: 4, startTime: 8.0, duration: 0.25, frequency: 'Daily' },
  { id: 108, teamId: 'teamB', title: 'Daily Scrum', dayIndex: 4, startTime: 8.25, duration: 0.25, frequency: 'Daily' },
  { id: 109, teamId: 'teamC', title: 'Daily Scrum', dayIndex: 4, startTime: 8.5, duration: 0.25, frequency: 'Daily' },
  { id: 110, teamId: 'teamD', title: 'Daily Scrum', dayIndex: 4, startTime: 8.75, duration: 0.25, frequency: 'Daily' },
  
  // Week 2 - Monday (All teams have Scrums)
  { id: 201, teamId: 'teamA', title: 'Daily Scrum', dayIndex: 5, startTime: 8.0, duration: 0.25, frequency: 'Daily' },
  { id: 202, teamId: 'teamB', title: 'Daily Scrum', dayIndex: 5, startTime: 8.25, duration: 0.25, frequency: 'Daily' },
  { id: 203, teamId: 'teamC', title: 'Daily Scrum', dayIndex: 5, startTime: 8.5, duration: 0.25, frequency: 'Daily' },
  { id: 204, teamId: 'teamD', title: 'Daily Scrum', dayIndex: 5, startTime: 8.75, duration: 0.25, frequency: 'Daily' },
  
  // Week 2 - Tuesday (No Scrums - All Hands only)
  { id: 10, teamId: 'rndEvents', title: 'All Hands Meeting', dayIndex: 6, startTime: 9.0, duration: 2.0, frequency: 'Weekly' },
  
  // Week 2 - Wednesday (Grooming for A & B, Scrums for C & D at 7:30 & 7:45)
  { id: 205, teamId: 'teamC', title: 'Daily Scrum', dayIndex: 7, startTime: 7.5, duration: 0.25, frequency: 'Daily' },
  { id: 206, teamId: 'teamD', title: 'Daily Scrum', dayIndex: 7, startTime: 7.75, duration: 0.25, frequency: 'Daily' },
  { id: 11, teamId: 'teamA', title: 'Grooming + Estimation', dayIndex: 7, startTime: 8.0, duration: 1.0, frequency: 'Weekly' },
  { id: 12, teamId: 'teamB', title: 'Grooming + Estimation', dayIndex: 7, startTime: 9.0, duration: 1.0, frequency: 'Weekly' },
  
  // Week 2 - Thursday (Grooming for C & D, Sprint Planning for A, Scrum for B)
  { id: 13, teamId: 'teamC', title: 'Grooming + Estimation', dayIndex: 8, startTime: 7.5, duration: 1.0, frequency: 'Weekly' },
  { id: 14, teamId: 'teamD', title: 'Grooming + Estimation', dayIndex: 8, startTime: 8.5, duration: 1.0, frequency: 'Weekly' },
  { id: 207, teamId: 'teamB', title: 'Daily Scrum', dayIndex: 8, startTime: 9.5, duration: 0.25, frequency: 'Daily' },
  { id: 15, teamId: 'teamA', title: 'Sprint Planning', dayIndex: 8, startTime: 9.75, duration: 0.75, frequency: 'Bi-weekly' },
  
  // Week 2 - Friday (Sprint Planning for all, no Scrums)
  { id: 16, teamId: 'teamB', title: 'Sprint Planning', dayIndex: 9, startTime: 7.75, duration: 0.75, frequency: 'Bi-weekly' },
  { id: 17, teamId: 'teamC', title: 'Sprint Planning', dayIndex: 9, startTime: 8.5, duration: 0.75, frequency: 'Bi-weekly' },
  { id: 18, teamId: 'teamD', title: 'Sprint Planning', dayIndex: 9, startTime: 9.25, duration: 0.75, frequency: 'Bi-weekly' },
];

export const EventProvider = ({ children }) => {
  const [events, setEvents] = useState(() => {
    const savedEvents = localStorage.getItem('patagonia-events');
    return savedEvents ? JSON.parse(savedEvents) : DEFAULT_EVENTS;
  });

  useEffect(() => {
    localStorage.setItem('patagonia-events', JSON.stringify(events));
  }, [events]);

  const addEvent = (event) => {
    const newEvent = {
      ...event,
      id: Math.max(0, ...events.map(e => e.id)) + 1
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const updateEvent = (eventId, updates) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, ...updates } : event
    ));
  };

  const deleteEvent = (eventId) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  };

  const resetEvents = () => {
    setEvents(DEFAULT_EVENTS);
    localStorage.setItem('patagonia-events', JSON.stringify(DEFAULT_EVENTS));
  };

  return (
    <EventContext.Provider value={{ events, addEvent, updateEvent, deleteEvent, resetEvents }}>
      {children}
    </EventContext.Provider>
  );
};
