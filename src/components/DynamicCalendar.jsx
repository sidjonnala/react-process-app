import React, { useState } from 'react';
import { useTeams } from '../context/TeamContext';
import { useEvents } from '../context/EventContext';
import './DynamicCalendar.css';

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

function DynamicCalendar() {
  const { teams } = useTeams();
  const { events, addEvent, updateEvent, deleteEvent, resetEvents } = useEvents();
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
      updateEvent(editingEvent.id, eventData);
    } else {
      addEvent({ ...eventData, ...selectedSlot });
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
      return event.dayIndex === actualDayIndex && 
             event.startTime < timeSlot + 0.25 && 
             eventEnd > timeSlot;
    });
  };

  const calculateEventHeight = (duration) => {
    return duration * 200; // 200px per hour (50px per 15min slot)
  };

  return (
    <div className="dynamic-calendar-container">
      <div className="calendar-controls">
        <div className="week-navigation">
          <button 
            onClick={() => handleWeekChange(1)} 
            className={`week-btn ${currentWeek === 1 ? 'active' : ''}`}
            disabled={currentWeek === 1}
          >
            ← Week 1
          </button>
          <span className="week-indicator">Sprint Week {currentWeek}</span>
          <button 
            onClick={() => handleWeekChange(2)} 
            className={`week-btn ${currentWeek === 2 ? 'active' : ''}`}
            disabled={currentWeek === 2}
          >
            Week 2 →
          </button>
        </div>
        <div className="action-buttons">
          <button onClick={() => setShowAddModal(true)} className="add-event-btn">
            ➕ Add Event
          </button>
          <button onClick={resetEvents} className="reset-btn">
            🔄 Reset to Defaults
          </button>
        </div>
      </div>

      <div className="calendar-legend">
        {Object.entries(teams).map(([teamId, team]) => (
          <div key={teamId} className="legend-item">
            <div className="legend-color" style={{ backgroundColor: team.color }}></div>
            <span>{team.name}</span>
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        <div className="calendar-header">
          <div className="time-column-header">Time</div>
          {currentWeekDays.map((day, index) => (
            <div key={index} className="day-header">
              <div className="day-name">{day.name}</div>
            </div>
          ))}
        </div>

        <div className="calendar-body" ref={calendarBodyRef}>
          {TIME_SLOTS.map((timeSlot, timeIndex) => (
            <div key={timeIndex} className="time-row">
              <div className="time-label">{formatTime(timeSlot)}</div>
              {currentWeekDays.map((day, dayIndex) => {
                const slotEvents = getEventsForSlot(dayIndex, timeSlot);
                const isFirstSlotForEvent = (event) => event.startTime === timeSlot;
                
                return (
                  <div
                    key={dayIndex}
                    className="calendar-cell"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, dayIndex, timeSlot)}
                    onDoubleClick={() => handleAddEvent(dayIndex, timeSlot)}
                  >
                    {slotEvents.filter(isFirstSlotForEvent).map(event => {
                      const teamConfig = getTeamConfig(event.teamId);
                      const height = calculateEventHeight(event.duration);
                      const tooltipText = `${teamConfig.name} - ${event.title}\n${formatTime(event.startTime)} - ${formatTime(event.startTime + event.duration)}\n${getDurationText(event.duration)}\n${event.frequency || ''}`;
                      
                      return (
                        <div
                          key={event.id}
                          className="calendar-event"
                          style={{
                            backgroundColor: teamConfig.color,
                            height: `${height}px`
                          }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, event)}
                          onClick={() => handleEditEvent(event)}
                          title={tooltipText}
                        >
                          <div className="event-title">{event.title}</div>
                          <div className="event-team">{teamConfig.name}</div>
                          <div className="event-time">
                            {formatTime(event.startTime)} - {formatTime(event.startTime + event.duration)}
                          </div>
                          <div className="event-duration">({getDurationText(event.duration)})</div>
                          {event.frequency && <div className="event-frequency">{event.frequency}</div>}
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

      <div className="calendar-instructions">
        <p>💡 <strong>Tip:</strong> Double-click a cell to add an event, drag events to move them, click an event to edit. Scroll down to see more time slots (6 AM - 5 PM). 2-week sprint cycle shown.</p>
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
    frequency: event?.frequency || 'Weekly'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{event ? 'Edit Event' : 'Add New Event'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Team</label>
            <select
              value={formData.teamId}
              onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
              required
            >
              {Object.entries(teams).map(([id, team]) => (
                <option key={id} value={id}>{team.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Event Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Day</label>
            <select
              value={formData.dayIndex}
              onChange={(e) => setFormData({ ...formData, dayIndex: parseInt(e.target.value) })}
              required
            >
              {DAYS.map((day, index) => (
                <option key={index} value={index}>{day.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Start Time</label>
            <select
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: parseFloat(e.target.value) })}
              required
            >
              {TIME_SLOTS.map((time) => (
                <option key={time} value={time}>{formatTime(time)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Duration (hours)</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) })}
              required
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

          <div className="form-group">
            <label>Frequency</label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Bi-weekly">Bi-weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          <div className="modal-actions">
            {onDelete && (
              <button type="button" onClick={onDelete} className="delete-btn">
                Delete
              </button>
            )}
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="save-btn">
              {event ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DynamicCalendar;
