# React Process App

A React application for visualizing team sprint ceremonies in a weekly calendar format.

## Features

- 📅 **Weekly Schedule View**: Displays all sprint ceremonies in a clear calendar format
- 👥 **Multiple Teams**: Track ceremonies across Team A, B, C, and D
- ⏰ **Time Management**: See all meeting times at a glance (EST timezone)
- 🎨 **Color Coded**: Easily distinguish between different team events
- 📥 **Export**: Download the calendar as PNG

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd react-process-app
```

2. Install dependencies:
```bash
npm install
```

### Running the App

Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Routes

- `/` - Home page with app overview
- `/weeklyschedule` - Weekly sprint ceremonies calendar view

## Tech Stack

- **React** - UI library
- **React Router** - Client-side routing
- **Vite** - Build tool and dev server
- **Canvas API** - Calendar rendering

## Project Structure

```
react-process-app/
├── public/
├── src/
│   ├── components/
│   │   └── SprintCalendar.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Home.css
│   │   ├── WeeklySchedule.jsx
│   │   └── WeeklySchedule.css
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
└── package.json
```

## Expandability

The app is structured to be easily expandable:
- Add new routes in `App.jsx`
- Create new pages in `src/pages/`
- Add new components in `src/components/`
- The routing system supports adding more calendar views or other features

## Sprint Ceremonies Included

- **Retrospectives** (Bi-weekly) - Monday mornings
- **All Hands** (Weekly) - Tuesday 9:00-11:00
- **Grooming + Estimation** (Weekly) - Wednesday & Thursday
- **Sprint Planning** (Bi-weekly) - Thursday & Friday
