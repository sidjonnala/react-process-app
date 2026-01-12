import React from 'react';
import './StoryPointing.css';

function StoryPointing() {
  return (
    <div className="story-pointing-container">
      <div className="sp-header">
        <h1 className="sp-title">Story Pointing & Planning Poker Guide</h1>
        <p className="sp-subtitle">— For Grooming & Refinement Sessions —</p>
      </div>

      <div className="sp-content">
        <div className="sp-intro-section">
          <div className="sp-intro-card">
            <h2>Story points are a <em>relative, unitless measure of effort</em>.</h2>
            <ul className="sp-factors">
              <li>Complexity</li>
              <li>Uncertainty</li>
              <li>Work</li>
            </ul>
          </div>
          <div className="sp-note-box">
            <strong>Not hours!</strong>
            <br />
            Not time estimates!
          </div>
        </div>

        <div className="sp-planning-poker">
          <h3>Planning Poker: <span className="highlight">Team discussion to reach consensus.</span></h3>
        </div>

        <div className="sp-two-column">
          <div className="sp-column">
            <h3 className="section-title">Fibonacci Scale</h3>
            <table className="fibonacci-table">
              <thead>
                <tr>
                  <th>Points</th>
                  <th>Effort</th>
                  <th>Example</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>1</strong></td>
                  <td>Trivial</td>
                  <td><em>Text Change</em></td>
                </tr>
                <tr>
                  <td><strong>2</strong></td>
                  <td>Small</td>
                  <td><em>Simple Validation</em></td>
                </tr>
                <tr>
                  <td><strong>3</strong></td>
                  <td>Moderate</td>
                  <td><em>Small API Change</em></td>
                </tr>
                <tr>
                  <td><strong>5</strong></td>
                  <td>Medium</td>
                  <td><em>New Page with Backend</em></td>
                </tr>
                <tr>
                  <td><strong>8</strong></td>
                  <td>Large</td>
                  <td><em>Feature Across Teams</em></td>
                </tr>
                <tr>
                  <td><strong>13</strong></td>
                  <td>Very Large</td>
                  <td><em>Major Workflow (Break Down)</em></td>
                </tr>
              </tbody>
            </table>
            <div className="sp-warning">&gt; 13 <strong>Split the Story!</strong></div>
          </div>

          <div className="sp-column">
            <h3 className="section-title">How We Estimate</h3>
            <div className="estimation-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <strong>BA walks through the particular ticket</strong>
                  <div className="step-icon">📋</div>
                </div>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <strong>Ask Questions</strong>
                  <div className="step-icon">💬</div>
                </div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <strong>Pick a Card</strong>
                  <div className="step-icon">🃏</div>
                </div>
              </div>
              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <strong>Reveal & Discuss</strong>
                  <div className="step-icon">💭</div>
                </div>
              </div>
              <div className="step">
                <div className="step-number">5</div>
                <div className="step-content">
                  <strong>Assign Final Story Points</strong>
                  <br />
                  <span className="sub-text">(Re-Vote if Needed)</span>
                  <div className="step-icon">✅</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sp-two-column protocol-section">
          <div className="sp-column">
            <h3 className="section-title protocol-title">Pointing Session Protocol</h3>
            <ul className="protocol-list">
              <li><span className="icon">📅</span> Weekly Sessions</li>
              <li><span className="icon">👥</span> BA, EM, Team</li>
              <li><span className="icon">📝</span> Review, Discuss & Point Tickets</li>
            </ul>
          </div>

          <div className="sp-column">
            <h3 className="section-title guidelines-title">Guidelines & Key Points</h3>
            <ul className="guidelines-list">
              <li><strong>No Hours</strong> - Use Past Stories</li>
              <li><strong>Time Box</strong> Discussions</li>
              <li><strong>Split Stories</strong> &gt; 13</li>
            </ul>
          </div>
        </div>

        <div className="sp-footer">
          <h2>Pointing Session Protocol</h2>
          <p className="footer-tagline">Accuracy Improves as We Calibrate Together</p>
        </div>
      </div>
    </div>
  );
}

export default StoryPointing;
