import React from 'react';
import DynamicCalendar from '../components/DynamicCalendar';
import './WeeklySchedule.css';

function WeeklySchedule() {
  React.useEffect(() => {
    // Add class to main-content for this view
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.classList.add('weekly-schedule-view');
    }
    
    return () => {
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.classList.remove('weekly-schedule-view');
      }
    };
  }, []);

  return (
    <div className="weekly-schedule-container">
      <div className="schedule-header">
        <h1>Sprint Cycle Calendar (2 Weeks)</h1>
        <p>Drag and drop events to reschedule, double-click to add new events</p>
      </div>
      <DynamicCalendar />
    </div>
  );
}

export default WeeklySchedule;
