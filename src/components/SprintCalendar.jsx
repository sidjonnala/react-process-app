import React, { useEffect, useRef } from 'react';
import { useTeams } from '../context/TeamContext';

const SprintCalendar = () => {
  const canvasRef = useRef(null);
  const { teams, allHands } = useTeams();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 1400;
    canvas.height = 1000;

    const colors = {
      teamA: teams.teamA.color,
      teamB: teams.teamB.color,
      teamC: teams.teamC.color,
      teamD: teams.teamD.color,
      allHands: allHands.color
    };

    const roundRect = (x, y, width, height, radius) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText('🗓️ Sprint Ceremonies - Week Calendar', canvas.width / 2, 50);

    ctx.font = '16px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('Team Meetings Plan (EST)', canvas.width / 2, 80);

    const legendY = 110;
    const legendItems = [
      { color: colors.teamA, label: teams.teamA.name },
      { color: colors.teamB, label: teams.teamB.name },
      { color: colors.teamC, label: teams.teamC.name },
      { color: colors.teamD, label: teams.teamD.name },
      { color: colors.allHands, label: allHands.name }
    ];

    let legendX = 450;
    legendItems.forEach(item => {
      ctx.fillStyle = item.color;
      roundRect(legendX, legendY, 20, 20, 4);
      ctx.fill();
      
      ctx.fillStyle = '#333';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, legendX + 30, legendY + 15);
      legendX += 120;
    });

    const startX = 50;
    const startY = 160;
    const timeColWidth = 100;
    const dayColWidth = 240;
    const rowHeight = 80;

    const days = ['Monday\n(Sprint Start)', 'Tuesday\n(Scrum updates via team chat)', 'Wednesday', 'Thursday', 'Friday'];
    const times = ['7:00am','7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM'];

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    for (let i = 0; i <= times.length; i++) {
      const y = startY + 50 + (i * rowHeight);
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(startX + timeColWidth + (5 * dayColWidth), y);
      ctx.stroke();
    }

    for (let j = 0; j <= 6; j++) {
      const x = startX + (j === 0 ? 0 : timeColWidth + ((j - 1) * dayColWidth));
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY + 50 + (times.length * rowHeight));
      ctx.stroke();
    }

    ctx.fillStyle = '#667eea';
    ctx.fillRect(startX, startY, timeColWidth, 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Time', startX + timeColWidth / 2, startY + 30);

    days.forEach((day, i) => {
      ctx.fillStyle = '#667eea';
      ctx.fillRect(startX + timeColWidth + (i * dayColWidth), startY, dayColWidth, 50);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      const lines = day.split('\n');
      lines.forEach((line, lineIdx) => {
        ctx.fillText(line, startX + timeColWidth + (i * dayColWidth) + dayColWidth / 2, startY + 20 + (lineIdx * 16));
      });
    });

    times.forEach((time, i) => {
      const y = startY + 50 + (i * rowHeight);
      
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(startX, y, timeColWidth, rowHeight);
      
      ctx.fillStyle = '#666';
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(time, startX + timeColWidth / 2, y + rowHeight / 2 + 5);
    });

    const drawEvent = (dayIndex, startRow, durationRows, color, title, frequency, time) => {
      const x = startX + timeColWidth + (dayIndex * dayColWidth) + 4;
      const y = startY + 50 + ((startRow + 1) * rowHeight) + 4;
      const width = dayColWidth - 8;
      const height = (durationRows * rowHeight) - 8;
      
      ctx.fillStyle = color;
      roundRect(x, y, width, height, 8);
      ctx.fill();
      
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'transparent';
      ctx.fillText(title, x + width / 2, y + height / 2 - 8);
      ctx.fillText(frequency, x + width / 2, y + height / 2 + 6);
      
      ctx.font = '12px Arial';
      ctx.fillText(time, x + width / 2, y + height / 2 + 20);
    };

    drawEvent(0, 1, 1, colors.teamA, `${teams.teamA.name} Retro`, '(Bi-weekly)', '8:00 - 8:30 (30 min)');
    drawEvent(0, 2, 1, colors.teamB, `${teams.teamB.name} Retro`, '(Bi-weekly)', '8:30 - 9:00 (30 min)');
    drawEvent(0, 3, 1, colors.teamC, `${teams.teamC.name} Retro`, '(Bi-weekly)', '9:00 - 9:30 (30 min)');
    drawEvent(0, 4, 1, colors.teamD, `${teams.teamD.name} Retro`, '(Bi-weekly)', '9:30 - 10:00 (30 min)');
    drawEvent(1, 3, 4, colors.allHands, allHands.name, '(Weekly)', '9:00 - 11:00 (2 hrs)');
    drawEvent(2, 1, 2, colors.teamA, `${teams.teamA.name} Grooming + Estimation`, '(Weekly)', '8:00 - 9:00 (1 hr)');
    drawEvent(2, 3, 2, colors.teamB, `${teams.teamB.name} Grooming + Estimation`, '(Weekly)', '9:00 - 10:00 (1 hr)');
    drawEvent(3, 0, 2, colors.teamC, `${teams.teamC.name} Grooming + Estimation`, '(Weekly)', '7:30 - 8:30 (1 hr)');
    drawEvent(3, 2, 2, colors.teamD, `${teams.teamD.name} Grooming + Estimation`, '(Weekly)', '8:30 - 9:30 (1 hr)');
    drawEvent(3, 4, 1.5, colors.teamA, `${teams.teamA.name} Sprint Planning`, '(Bi-weekly)', '9:30 - 10:15 (45 min)');
    drawEvent(4, 0.25, 1.5, colors.teamB, `${teams.teamB.name} Sprint Planning`, '(Bi-weekly)', '7:45 - 8:30 (45 min)');
    drawEvent(4, 1.75, 1.5, colors.teamC, `${teams.teamC.name} Sprint Planning`, '(Bi-weekly)', '8:30 - 9:15 (45 min)');
    drawEvent(4, 3.25, 1.5, colors.teamD, `${teams.teamD.name} Sprint Planning`, '(Bi-weekly)', '9:15 - 10:00 (45 min)');

  }, [teams, allHands]);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: '100%',
            height: 'auto',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}
        />
      </div>
    </div>
  );
};

export default SprintCalendar;
