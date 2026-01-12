import React from 'react';
import SprintCalendar from '../components/SprintCalendar';
import './WeeklySchedule.css';

function WeeklySchedule() {
  return (
    <div className="weekly-schedule-container">
      <div className="schedule-header">
        <h1>Weekly Sprint Ceremonies</h1>
        <p>View all team sprint ceremonies for the week</p>
      </div>
      <SprintCalendar />
    </div>
  );
}

export default WeeklySchedule;
