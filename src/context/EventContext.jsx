import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

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
  const [useFirebase, setUseFirebase] = useState(false);

  // Try to initialize Firebase connection
  useEffect(() => {
    const checkFirebase = async () => {
      try {
        // Check if Firebase is configured
        if (db) {
          setUseFirebase(true);
          console.log('✅ Firebase connected - syncing data');
        }
      } catch (error) {
        console.log('📦 Using localStorage - Firebase not configured');
        setUseFirebase(false);
      }
    };
    checkFirebase();
  }, []);

  // Subscribe to Firebase changes in real-time
  useEffect(() => {
    if (!useFirebase) return;

    const unsubscribe = onSnapshot(collection(db, 'events'), (snapshot) => {
      const firebaseEvents = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      
      if (firebaseEvents.length > 0) {
        setEvents(firebaseEvents);
        localStorage.setItem('patagonia-events', JSON.stringify(firebaseEvents));
      }
    }, (error) => {
      console.error('Firebase sync error:', error);
      setUseFirebase(false);
    });

    return () => unsubscribe();
  }, [useFirebase]);

  // Fallback: Save to localStorage only if Firebase is not enabled
  useEffect(() => {
    if (!useFirebase) {
      localStorage.setItem('patagonia-events', JSON.stringify(events));
    }
  }, [events, useFirebase]);

  const addEvent = async (event) => {
    const newEvent = {
      ...event,
      id: String(Math.max(0, ...events.map(e => Number(e.id) || 0)) + 1)
    };
    
    if (useFirebase) {
      try {
        await setDoc(doc(db, 'events', newEvent.id), newEvent);
      } catch (error) {
        console.error('Error adding event to Firebase:', error);
        setEvents(prev => [...prev, newEvent]);
      }
    } else {
      setEvents(prev => [...prev, newEvent]);
    }
  };

  const addMultipleEvents = async (eventsToAdd) => {
    // Calculate starting ID
    let nextId = Math.max(0, ...events.map(e => Number(e.id) || 0)) + 1;
    
    // Create all events with unique IDs
    const newEvents = eventsToAdd.map((event, index) => ({
      ...event,
      id: String(nextId + index)
    }));
    
    if (useFirebase) {
      try {
        // Add all events to Firebase
        await Promise.all(
          newEvents.map(event => setDoc(doc(db, 'events', event.id), event))
        );
      } catch (error) {
        console.error('Error adding events to Firebase:', error);
        setEvents(prev => [...prev, ...newEvents]);
      }
    } else {
      setEvents(prev => [...prev, ...newEvents]);
    }
  };

  const updateEvent = async (eventId, updates) => {
    if (useFirebase) {
      try {
        const event = events.find(e => e.id === eventId);
        await setDoc(doc(db, 'events', String(eventId)), { ...event, ...updates });
      } catch (error) {
        console.error('Error updating event in Firebase:', error);
        setEvents(prev => prev.map(event => 
          event.id === eventId ? { ...event, ...updates } : event
        ));
      }
    } else {
      setEvents(prev => prev.map(event => 
        event.id === eventId ? { ...event, ...updates } : event
      ));
    }
  };

  const deleteEvent = async (eventId) => {
    if (useFirebase) {
      try {
        await deleteDoc(doc(db, 'events', String(eventId)));
      } catch (error) {
        console.error('Error deleting event from Firebase:', error);
        setEvents(prev => prev.filter(event => event.id !== eventId));
      }
    } else {
      setEvents(prev => prev.filter(event => event.id !== eventId));
    }
  };

  const resetEvents = async () => {
    if (useFirebase) {
      try {
        // Delete all existing events
        const snapshot = await getDocs(collection(db, 'events'));
        await Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)));
        
        // Add default events
        await Promise.all(DEFAULT_EVENTS.map(event =>
          setDoc(doc(db, 'events', String(event.id)), event)
        ));
      } catch (error) {
        console.error('Error resetting events in Firebase:', error);
        setEvents(DEFAULT_EVENTS);
        localStorage.setItem('patagonia-events', JSON.stringify(DEFAULT_EVENTS));
      }
    } else {
      setEvents(DEFAULT_EVENTS);
      localStorage.setItem('patagonia-events', JSON.stringify(DEFAULT_EVENTS));
    }
  };

  return (
    <EventContext.Provider value={{ events, addEvent, addMultipleEvents, updateEvent, deleteEvent, resetEvents, useFirebase }}>
      {children}
    </EventContext.Provider>
  );
};
