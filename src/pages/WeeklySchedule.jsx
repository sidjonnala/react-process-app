import React from 'react';
import DynamicCalendar from '../components/DynamicCalendar';

function WeeklySchedule() {
  return (
    <div className="h-full flex flex-col">
      <div className="text-center mb-2 max-md:mb-1">
        <h1 className="text-2xl font-bold text-gray-800 mb-1 max-md:text-lg">Sprint Cycle Calendar (2 Weeks)</h1>
        <p className="text-sm text-gray-600 max-md:text-xs">Drag and drop events to reschedule, double-click to add new events</p>
      </div>
      <DynamicCalendar />
    </div>
  );
}

export default WeeklySchedule;
