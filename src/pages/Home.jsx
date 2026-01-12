import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="hero-title">Patagonia R&D Hub</h1>
        <p className="hero-subtitle">
          Manage and visualize your team's sprint ceremonies
        </p>
        <Link to="/weeklyschedule" className="cta-button">
          View Weekly Schedule
        </Link>
      </div>
      
      <div className="features-section">
        <h2 className="features-title">Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Weekly Schedule</h3>
            <p>View all sprint ceremonies in a clear calendar format</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Multiple Teams</h3>
            <p>Track ceremonies across multiple agile teams</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⏰</div>
            <h3>Time Management</h3>
            <p>See all meeting times at a glance</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>Color Coded</h3>
            <p>Easily distinguish between team events</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
