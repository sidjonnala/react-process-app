import React, { useState } from 'react';
import { useTeams } from '../context/TeamContext';
import { useEvents } from '../context/EventContext';

const DAYS = [
  { name: 'Monday', week: 1, label: 'Week 1 - Monday' },
  { name: 'Tuesday', week: 1, label: 'Week 1 - Tuesday' },
  { name: 'Wednesday', week: 1, label: 'Week 1 - Wednesday' },
  { name: 'Thursday', week: 1, label: 'Week 1 - Thursday' },
  { name: 'Friday', week: 1, label: 'Week 1 - Friday' },
  { name: 'Monday', week: 2, label: 'Week 2 - Monday' },
  { name: 'Tuesday', week: 2, label: 'Week 2 - Tuesday' },
  { name: 'Wednesday', week: 2, label: 'Week 2 - Wednesday' },
  { name: 'Thursday', week: 2, label: 'Week 2 - Thursday' },
  { name: 'Friday', week: 2, label: 'Week 2 - Friday' }
];

const TIME_SLOTS = [
  6.0, 6.25, 6.5, 6.75,
  7.0, 7.25, 7.5, 7.75, 
  8.0, 8.25, 8.5, 8.75, 
  9.0, 9.25, 9.5, 9.75, 
  10.0, 10.25, 10.5, 10.75,
  11.0, 11.25, 11.5, 11.75,
  12.0, 12.25, 12.5, 12.75,
  13.0, 13.25, 13.5, 13.75,
  14.0, 14.25, 14.5, 14.75,
  15.0, 15.25, 15.5, 15.75,
  16.0, 16.25, 16.5, 16.75,
  17.0
];

const formatTime = (time) => {
  const hour = Math.floor(time);
  const minutes = (time % 1) * 60;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const getDurationText = (duration) => {
  if (duration === 1) return '1 hr';
  if (duration < 1) return `${duration * 60} min`;
  return `${duration} hrs`;
};

function DynamicCalendar({ selectedTeams = [] }) {
  const { teams } = useTeams();
  const { events, addEvent, addMultipleEvents, updateEvent, deleteEvent, resetEvents } = useEvents();
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const calendarBodyRef = React.useRef(null);

  // Auto-scroll to 7am on mount
  React.useEffect(() => {
    const scrollToTime = () => {
      if (calendarBodyRef.current) {
        // 7am is at index 4 (after 6am slots: 6.0, 6.25, 6.5, 6.75)
        // Scroll to show 7am at the top
        const scrollTo = 4 * 50; // 200px
        calendarBodyRef.current.scrollTop = scrollTo;
      }
    };
    
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(scrollToTime, 150);
  }, [currentWeek]); // Re-scroll when week changes

  const getTeamConfig = (teamId) => {
    return teams[teamId] || teams.rndEvents;
  };

  // Get days for current week
  const currentWeekDays = DAYS.filter(day => day.week === currentWeek);
  
  // Get day indices for current week
  const currentWeekIndices = DAYS.map((day, index) => ({ ...day, originalIndex: index }))
                                  .filter(day => day.week === currentWeek)
                                  .map(day => day.originalIndex);

  const handleWeekChange = (weekNumber) => {
    setCurrentWeek(weekNumber);
  };

  const handleDragStart = (e, event) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, displayDayIndex, timeSlot) => {
    e.preventDefault();
    if (draggedEvent) {
      const actualDayIndex = currentWeekIndices[displayDayIndex];
      updateEvent(draggedEvent.id, {
        dayIndex: actualDayIndex,
        startTime: timeSlot
      });
      setDraggedEvent(null);
    }
  };

  const handleAddEvent = (displayDayIndex, timeSlot) => {
    const actualDayIndex = currentWeekIndices[displayDayIndex];
    setSelectedSlot({ dayIndex: actualDayIndex, timeSlot });
    setShowAddModal(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowAddModal(true);
  };

  const handleSaveEvent = (eventData) => {
    if (editingEvent) {
      // When editing, just update the single event
      updateEvent(editingEvent.id, eventData);
    } else {
      // When adding new event, handle frequency
      const { frequency, ...baseEventFields } = eventData;
      const { dayIndex: selectedDayIndex, timeSlot } = selectedSlot || { dayIndex: eventData.dayIndex, timeSlot: eventData.startTime };
      
      const eventsToAdd = [];
      
      if (frequency === 'Daily') {
        // Add event to all 10 days (Mon-Fri for both weeks)
        DAYS.forEach((day, index) => {
          eventsToAdd.push({
            ...baseEventFields,
            frequency,
            dayIndex: index,
            startTime: timeSlot
          });
        });
      } else if (frequency === 'Weekly') {
        // Add event to same day of week in both weeks
        const dayOfWeek = selectedDayIndex % 5; // 0-4 (Mon-Fri)
        
        // Week 1 occurrence (indices 0-4)
        eventsToAdd.push({
          ...baseEventFields,
          frequency,
          dayIndex: dayOfWeek,
          startTime: timeSlot
        });
        
        // Week 2 occurrence (indices 5-9)
        eventsToAdd.push({
          ...baseEventFields,
          frequency,
          dayIndex: dayOfWeek + 5,
          startTime: timeSlot
        });
      } else if (frequency === 'Bi-weekly' || frequency === 'Monthly') {
        // Add event only to the selected day (once per 2-week cycle)
        eventsToAdd.push({
          ...baseEventFields,
          frequency,
          dayIndex: selectedDayIndex,
          startTime: timeSlot
        });
      } else {
        // Default: just add to selected slot
        eventsToAdd.push({
          ...baseEventFields,
          frequency,
          dayIndex: selectedDayIndex,
          startTime: timeSlot
        });
      }
      
      // Add all events at once using batch function
      if (eventsToAdd.length > 1) {
        addMultipleEvents(eventsToAdd);
      } else {
        addEvent(eventsToAdd[0]);
      }
    }
    setShowAddModal(false);
    setEditingEvent(null);
    setSelectedSlot(null);
  };

  const handleDeleteEvent = (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      deleteEvent(eventId);
      setShowAddModal(false);
      setEditingEvent(null);
    }
  };

  const getEventsForSlot = (displayDayIndex, timeSlot) => {
    // Map display index to actual day index
    const actualDayIndex = currentWeekIndices[displayDayIndex];
    return events.filter(event => {
      const eventEnd = event.startTime + event.duration;
      const teamConfig = getTeamConfig(event.teamId);
      
      // Filter by selected teams
      const isTeamSelected = selectedTeams.length === 0 || selectedTeams.includes(teamConfig.name);
      
      return event.dayIndex === actualDayIndex && 
             event.startTime < timeSlot + 0.25 && 
             eventEnd > timeSlot &&
             isTeamSelected;
    });
  };

  const calculateEventHeight = (duration) => {
    return duration * 200; // 200px per hour (50px per 15min slot)
  };

  // Check if two events overlap
  const eventsOverlap = (event1, event2) => {
    const end1 = event1.startTime + event1.duration;
    const end2 = event2.startTime + event2.duration;
    return !(event1.startTime >= end2 || end1 <= event2.startTime);
  };

  // Get position info for an event considering only its overlapping neighbors
  const getEventPosition = (event, displayDayIndex) => {
    const actualDayIndex = currentWeekIndices[displayDayIndex];
    const dayEvents = events.filter(e => e.dayIndex === actualDayIndex);
    
    // Find all events that overlap with this specific event
    const overlapping = dayEvents.filter(e => 
      e.id !== event.id && eventsOverlap(e, event)
    );
    
    if (overlapping.length === 0) {
      // No overlap, use full width
      return { left: 0, width: 100, totalOverlapping: 1 };
    }
    
    // Sort overlapping events by start time, then by id for consistency
    const allOverlapping = [event, ...overlapping].sort((a, b) => {
      if (a.startTime !== b.startTime) return a.startTime - b.startTime;
      // Compare IDs as strings or numbers
      if (typeof a.id === 'string' && typeof b.id === 'string') {
        return a.id.localeCompare(b.id);
      }
      return String(a.id).localeCompare(String(b.id));
    });
    
    const position = allOverlapping.findIndex(e => e.id === event.id);
    const totalColumns = allOverlapping.length;
    const widthPercent = 100 / totalColumns;
    const leftPercent = position * widthPercent;
    
    return {
      left: leftPercent,
      width: widthPercent,
      totalOverlapping: totalColumns
    };
  };

  return (
    <div className="w-full bg-white p-2 rounded-xl shadow-lg flex flex-col h-full overflow-hidden max-md:p-1 max-md:rounded-lg">
      <div className="flex gap-2 mb-2 justify-between items-center flex-shrink-0 flex-wrap max-md:gap-1 max-md:mb-1">
        <div className="flex gap-2 items-center flex-wrap max-md:w-full max-md:justify-center max-md:gap-1">
          <button 
            onClick={() => handleWeekChange(1)} 
            className={`px-3 py-1.5 border-none rounded-lg font-semibold cursor-pointer transition-all duration-200 text-white text-xs whitespace-nowrap bg-gradient-to-r from-indigo-500 to-purple-600 ${currentWeek === 1 ? 'bg-gray-500 cursor-default' : 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-400/40'} disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-60 max-md:px-2 max-md:py-1.5 max-md:text-[0.7rem]`}
            disabled={currentWeek === 1}
          >
            ← Week 1
          </button>
          <span className="font-bold text-sm text-gray-800 min-w-[100px] text-center max-md:text-xs max-md:min-w-[90px]">Sprint Week {currentWeek}</span>
          <button 
            onClick={() => handleWeekChange(2)} 
            className={`px-3 py-1.5 border-none rounded-lg font-semibold cursor-pointer transition-all duration-200 text-white text-xs whitespace-nowrap bg-gradient-to-r from-indigo-500 to-purple-600 ${currentWeek === 2 ? 'bg-gray-500 cursor-default' : 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-400/40'} disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-60 max-md:px-2 max-md:py-1.5 max-md:text-[0.7rem]`}
            disabled={currentWeek === 2}
          >
            Week 2 →
          </button>
        </div>
        <div className="flex gap-2 flex-wrap max-md:w-full max-md:justify-center">
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 border-none rounded-lg font-semibold cursor-pointer transition-all duration-200 text-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-300/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-400/40 whitespace-nowrap max-md:px-2 max-md:py-1.5 max-md:text-[0.7rem] max-md:flex-1">
            ➕ Add Event
          </button>
          <button onClick={resetEvents} className="px-4 py-2 border-none rounded-lg font-semibold cursor-pointer transition-all duration-200 text-sm bg-red-600 text-white shadow-md shadow-red-300/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-400/40 whitespace-nowrap max-md:px-2 max-md:py-1.5 max-md:text-[0.7rem] max-md:flex-1">
            🔄 Reset to Defaults
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-2 flex-wrap p-1.5 bg-gray-50 rounded-lg text-xs flex-shrink-0 justify-center max-md:gap-1.5 max-md:p-1 max-md:text-[0.7rem]">
        {Object.entries(teams)
          .sort(([, a], [, b]) => {
            // R&D Events always goes last
            if (a.name === 'R&D Events') return 1;
            if (b.name === 'R&D Events') return -1;
            // Otherwise alphabetical
            return a.name.localeCompare(b.name);
          })
          .map(([teamId, team]) => {
            const isSelected = selectedTeams.includes(team.name);
            return (
              <div 
                key={teamId} 
                className={`flex items-center gap-1.5 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-30'}`}
              >
                <div className="w-4 h-4 rounded flex-shrink-0 max-md:w-3.5 max-md:h-3.5" style={{ backgroundColor: team.color }}></div>
                <span>{team.name}</span>
              </div>
            );
          })}
      </div>

      <div className="overflow-hidden border-2 border-gray-300 rounded-lg flex-1 flex flex-col min-h-0 text-xs max-md:text-[0.75rem]">
        <div className="grid grid-cols-[100px_repeat(5,1fr)] bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold sticky top-0 z-[100]">
          <div className="p-3 text-center border-r border-white/30 text-sm max-md:text-xs">Time</div>
          {currentWeekDays.map((day, index) => (
            <div key={index} className="p-3 text-center border-r border-white/30 flex flex-col justify-center">
              <div className="text-sm font-bold max-md:text-xs">{day.name}</div>
            </div>
          ))}
        </div>

        <div className="bg-white overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-indigo-500 [&::-webkit-scrollbar-thumb]:rounded hover:[&::-webkit-scrollbar-thumb]:bg-purple-600" ref={calendarBodyRef}>
          {TIME_SLOTS.map((timeSlot, timeIndex) => (
            <div key={timeIndex} className="grid grid-cols-[100px_repeat(5,1fr)] min-h-[50px] border-b border-gray-300 max-md:min-h-[40px]">
              <div className="p-1 text-center font-semibold text-gray-600 bg-gray-50 border-r-2 border-gray-300 flex items-start justify-center text-xs sticky left-0 z-10">{formatTime(timeSlot)}</div>
              {currentWeekDays.map((day, dayIndex) => {
                const slotEvents = getEventsForSlot(dayIndex, timeSlot);
                const isFirstSlotForEvent = (event) => event.startTime === timeSlot;
                
                return (
                  <div
                    key={dayIndex}
                    className="border-r border-gray-300 relative cursor-pointer transition-colors duration-200 hover:bg-gray-50"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, dayIndex, timeSlot)}
                    onDoubleClick={() => handleAddEvent(dayIndex, timeSlot)}
                  >
                    {slotEvents.filter(isFirstSlotForEvent).map(event => {
                      const teamConfig = getTeamConfig(event.teamId);
                      const height = calculateEventHeight(event.duration);
                      const tooltipText = `${teamConfig.name} - ${event.title}\n${formatTime(event.startTime)} - ${formatTime(event.startTime + event.duration)}\n${getDurationText(event.duration)}\n${event.frequency || ''}`;
                      
                      const position = getEventPosition(event, dayIndex);
                      
                      return (
                        <div
                          key={event.id}
                          className="absolute top-0.5 p-1.5 rounded-md text-white text-xs cursor-move shadow-md transition-all duration-200 overflow-hidden z-10 whitespace-nowrap text-ellipsis hover:scale-[1.02] hover:shadow-lg hover:z-20 hover:overflow-visible hover:whitespace-normal max-md:text-[0.6rem] max-md:p-1"
                          style={{
                            backgroundColor: teamConfig.color,
                            height: `${height}px`,
                            left: `${position.left}%`,
                            width: `calc(${position.width}% - 4px)`,
                            marginLeft: '2px'
                          }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, event)}
                          onClick={() => handleEditEvent(event)}
                          title={tooltipText}
                        >
                          <div className="font-bold mb-0.5 text-xs overflow-hidden text-ellipsis max-md:text-[0.65rem]">{event.title}</div>
                          <div className="text-[0.7rem] opacity-90 overflow-hidden text-ellipsis max-md:text-[0.55rem]">{teamConfig.name}</div>
                          <div className="text-[0.65rem] mt-0.5 overflow-hidden text-ellipsis max-md:text-[0.55rem]">
                            {formatTime(event.startTime)} - {formatTime(event.startTime + event.duration)}
                          </div>
                          <div className="text-[0.6rem] italic opacity-80 overflow-hidden text-ellipsis max-md:text-[0.55rem]">({getDurationText(event.duration)})</div>
                          {event.frequency && <div className="text-[0.6rem] mt-0.5 opacity-90 overflow-hidden text-ellipsis max-md:text-[0.55rem]">{event.frequency}</div>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {showAddModal && (
        <EventModal
          event={editingEvent}
          teams={teams}
          onSave={handleSaveEvent}
          onDelete={editingEvent ? () => handleDeleteEvent(editingEvent.id) : null}
          onClose={() => {
            setShowAddModal(false);
            setEditingEvent(null);
            setSelectedSlot(null);
          }}
        />
      )}

      <div className="mt-3 p-2 bg-blue-50 border-l-4 border-blue-500 rounded text-blue-900 text-xs flex-shrink-0 max-md:text-[0.75rem] max-md:p-1.5">
        <p className="m-0">💡 <strong>Tip:</strong> Double-click a cell to add an event, drag events to move them, click an event to edit. Scroll down to see more time slots (6 AM - 5 PM). 2-week sprint cycle shown.</p>
      </div>
    </div>
  );
}

function EventModal({ event, teams, onSave, onDelete, onClose }) {
  const [formData, setFormData] = useState({
    teamId: event?.teamId || 'teamA',
    title: event?.title || '',
    dayIndex: event?.dayIndex || 0,
    startTime: event?.startTime || 8.0,
    duration: event?.duration || 0.5,
    frequency: event?.frequency || 'Bi-weekly'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] max-md:p-2" onClick={onClose}>
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg w-[90%] max-h-[90vh] overflow-y-auto max-md:w-[95%] max-md:p-4 max-md:max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-6 text-gray-800 max-md:text-xl">{event ? 'Edit Event' : 'Add New Event'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6 max-md:mb-4">
            <label className="block mb-2 font-semibold text-gray-800 max-md:text-sm">Team</label>
            <select
              value={formData.teamId}
              onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
              required
              className="w-full p-3 border-2 border-gray-300 rounded-md text-base focus:outline-none focus:border-indigo-500 transition-colors max-md:p-2.5 max-md:text-sm"
            >
              {Object.entries(teams).map(([id, team]) => (
                <option key={id} value={id}>{team.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-6 max-md:mb-4">
            <label className="block mb-2 font-semibold text-gray-800 max-md:text-sm">Event Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full p-3 border-2 border-gray-300 rounded-md text-base focus:outline-none focus:border-indigo-500 transition-colors max-md:p-2.5 max-md:text-sm"
            />
          </div>

          <div className="mb-6 max-md:mb-4">
            <label className="block mb-2 font-semibold text-gray-800 max-md:text-sm">Day</label>
            <select
              value={formData.dayIndex}
              onChange={(e) => setFormData({ ...formData, dayIndex: parseInt(e.target.value) })}
              required
              className="w-full p-3 border-2 border-gray-300 rounded-md text-base focus:outline-none focus:border-indigo-500 transition-colors max-md:p-2.5 max-md:text-sm"
            >
              {DAYS.map((day, index) => (
                <option key={index} value={index}>{day.label}</option>
              ))}
            </select>
          </div>

          <div className="mb-6 max-md:mb-4">
            <label className="block mb-2 font-semibold text-gray-800 max-md:text-sm">Start Time</label>
            <select
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: parseFloat(e.target.value) })}
              required
              className="w-full p-3 border-2 border-gray-300 rounded-md text-base focus:outline-none focus:border-indigo-500 transition-colors max-md:p-2.5 max-md:text-sm"
            >
              {TIME_SLOTS.map((time) => (
                <option key={time} value={time}>{formatTime(time)}</option>
              ))}
            </select>
          </div>

          <div className="mb-6 max-md:mb-4">
            <label className="block mb-2 font-semibold text-gray-800 max-md:text-sm">Duration (hours)</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) })}
              required
              className="w-full p-3 border-2 border-gray-300 rounded-md text-base focus:outline-none focus:border-indigo-500 transition-colors max-md:p-2.5 max-md:text-sm"
            >
              <option value={0.25}>15 minutes</option>
              <option value={0.5}>30 minutes</option>
              <option value={0.75}>45 minutes</option>
              <option value={1.0}>1 hour</option>
              <option value={1.25}>1 hour 15 min</option>
              <option value={1.5}>1.5 hours</option>
              <option value={1.75}>1 hour 45 min</option>
              <option value={2.0}>2 hours</option>
              <option value={2.5}>2.5 hours</option>
              <option value={3.0}>3 hours</option>
            </select>
          </div>

          <div className="mb-6 max-md:mb-4">
            <label className="block mb-2 font-semibold text-gray-800 max-md:text-sm">Frequency</label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full p-3 border-2 border-gray-300 rounded-md text-base focus:outline-none focus:border-indigo-500 transition-colors max-md:p-2.5 max-md:text-sm"
            >
              <option value="Daily">Daily (Every day, both weeks)</option>
              <option value="Weekly">Weekly (Same day, both weeks)</option>
              <option value="Bi-weekly">Bi-weekly (Once per 2-week sprint)</option>
              <option value="Monthly">Monthly (Once per 2-week sprint)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.frequency === 'Daily' && '📅 Event will be added to all 10 days (Mon-Fri both weeks)'}
              {formData.frequency === 'Weekly' && '📅 Event will be added to the same day in both weeks'}
              {formData.frequency === 'Bi-weekly' && '📅 Event will be added only to the selected day'}
              {formData.frequency === 'Monthly' && '📅 Event will be added only to the selected day'}
            </p>
          </div>

          <div className="flex gap-4 justify-end mt-8 max-md:mt-6">
            {onDelete && (
              <button type="button" onClick={onDelete} className="px-6 py-3 border-none rounded-lg font-semibold cursor-pointer transition-transform duration-200 bg-red-600 text-white hover:-translate-y-0.5 mr-auto max-md:px-4 max-md:py-2.5 max-md:text-sm">
                Delete
              </button>
            )}
            <button type="button" onClick={onClose} className="px-6 py-3 border-none rounded-lg font-semibold cursor-pointer transition-transform duration-200 bg-gray-500 text-white hover:-translate-y-0.5 max-md:px-4 max-md:py-2.5 max-md:text-sm">
              Cancel
            </button>
            <button type="submit" className="px-6 py-3 border-none rounded-lg font-semibold cursor-pointer transition-transform duration-200 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:-translate-y-0.5 max-md:px-4 max-md:py-2.5 max-md:text-sm">
              {event ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DynamicCalendar;
