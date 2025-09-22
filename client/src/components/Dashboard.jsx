import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="landing-dashboard">
      {/* Navigation Header */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <div className="logo-icon">🛡️</div>
            <h2>SafeTourAI</h2>
          </div>
          <div className="nav-buttons">
            <Link to="/login" className="nav-btn login-btn">Login</Link>
            <Link to="/register" className="nav-btn register-btn">Register</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Smarter, Safer Journeys – Powered by AI
            </h1>
            <p className="hero-subtitle">
              Real-time safety alerts, fraud detection & secure travel — works even without internet.
            </p>
            <div className="hero-cta">
              <Link to="/register" className="cta-btn primary">Get Started</Link>
              <button className="cta-btn secondary" onClick={() => document.getElementById('demo-video')?.scrollIntoView()}>
                Watch Demo
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image">
              <div className="floating-elements">
                {/* Original floating cards */}
                <div className="floating-card card-1">
                  <div className="card-icon">🔒</div>
                  <div className="card-content">
                    <div className="card-title">AI Safety</div>
                    <div className="card-subtitle">Smart Protection</div>
                  </div>
                </div>
                <div className="floating-card card-2">
                  <div className="card-icon">⌚</div>
                  <div className="card-content">
                    <div className="card-title">Smart Band</div>
                    <div className="card-subtitle">Wearable Safety</div>
                  </div>
                </div>
                <div className="floating-card card-3">
                  <div className="card-icon">📡</div>
                  <div className="card-content">
                    <div className="card-title">Offline Mode</div>
                    <div className="card-subtitle">Always Connected</div>
                  </div>
                </div>
                
                {/* New feature cards based on mobile app */}
                <div className="floating-card feature-card-1">
                  <div className="card-icon">👤</div>
                  <div className="card-content">
                    <div className="card-title">Digital ID</div>
                    <div className="card-subtitle">Blockchain Verified</div>
                  </div>
                </div>
                
                <div className="floating-card feature-card-2">
                  <div className="card-icon">🤖</div>
                  <div className="card-content">
                    <div className="card-title">AI Chatbot</div>
                    <div className="card-subtitle">Travel Assistant</div>
                  </div>
                </div>
                
                <div className="floating-card feature-card-3">
                  <div className="card-icon">🚨</div>
                  <div className="card-content">
                    <div className="card-title">Emergency</div>
                    <div className="card-subtitle">SOS Panel</div>
                  </div>
                </div>
                
                <div className="floating-card feature-card-4">
                  <div className="card-icon">📊</div>
                  <div className="card-content">
                    <div className="card-title">Dashboard</div>
                    <div className="card-subtitle">System Status</div>
                  </div>
                </div>
                
                <div className="floating-card feature-card-5">
                  <div className="card-icon">🛡️</div>
                  <div className="card-content">
                    <div className="card-title">Travel Safety</div>
                    <div className="card-subtitle">Real-time Alerts</div>
                  </div>
                </div>
                
                <div className="floating-card feature-card-6">
                  <div className="card-icon">🌍</div>
                  <div className="card-content">
                    <div className="card-title">Cultural Guide</div>
                    <div className="card-subtitle">Local Awareness</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <h2 className="section-title">Key Features</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>AI Safety Alerts</h3>
              <p>Fraud & scam detection, even in offline mode</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h3>Smart Geo-Fencing & Heatmaps</h3>
              <p>Alerts about risky areas, with alternate routes</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🧧</div>
              <h3>Blockchain-based Digital ID</h3>
              <p>Tamper-proof secure travel identity</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📡</div>
              <h3>IoT & Band Connectivity</h3>
              <p>No worry about internet; our band ensures SOS & alerts anytime, anywhere</p>
            </div>
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="video-section" id="demo-video">
        <div className="container">
          <h2 className="section-title">
            Experience SafeTourAI in Action
          </h2>
          <div className="video-container">
            <div className="video-placeholder">
              <div className="video-content">
                <div className="play-button">▶</div>
                <p>Tourist Exploration Demo Video</p>
                <small>Click to play your custom video</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="problem-section">
        <div className="container">
          <h2 className="section-title">The Problem Tourists Face</h2>
          <div className="problem-grid">
            <div className="problem-card">
              <div className="problem-icon">🎭</div>
              <h3>Fake Guides & Scams</h3>
              <p>Tourists fall victim to fake guides, overcharging, and various scams</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">⚠️</div>
              <h3>Unsafe Crowded Zones</h3>
              <p>No awareness of dangerous areas or crowd surges</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">📶</div>
              <h3>No Real-time Safety Info</h3>
              <p>Lack of immediate safety alerts and information</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">🌐</div>
              <h3>Connectivity Issues</h3>
              <p>Poor internet in remote areas leaves tourists vulnerable</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Solution Section */}
      <section className="solution-section">
        <div className="container">
          <h2 className="section-title">Our AI-Powered Solution</h2>
          <p className="solution-subtitle">
            SafeTourAI is your AI-powered travel safety companion — always connected, even without internet.
          </p>
          <p className="solution-description">
            We use AI, Blockchain, IoT, Geo-fencing & dedicated band connectivity to keep tourists safe anywhere.
          </p>
          <div className="solution-visual">
            <div className="tech-stack">
              <div className="tech-item">AI</div>
              <div className="tech-connector">+</div>
              <div className="tech-item">Blockchain</div>
              <div className="tech-connector">+</div>
              <div className="tech-item">IoT</div>
              <div className="tech-connector">+</div>
              <div className="tech-item">Geo-fencing</div>
              <div className="tech-connector">+</div>
              <div className="tech-item">Band Connectivity</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Tourist Signs Up</h3>
                <p>Creates secure ID</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>AI Monitors</h3>
                <p>Detects scams, risks</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Geo-Fencing & Heatmaps</h3>
                <p>Crowd/risk alerts</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Offline Safety via Band</h3>
                <p>Alerts delivered without internet</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">5</div>
              <div className="step-content">
                <h3>Emergency Mode</h3>
                <p>Panic button shares location via band + IoT</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Innovation Section */}
      <section id="innovation" className="innovation-section">
        <div className="container">
          <h2 className="section-title">Innovation & Uniqueness</h2>
          <p className="innovation-subtitle">✨ What makes SafeTourAI different?</p>
          
          <div className="innovation-grid">
            <div className="innovation-card">
              <h3>First-of-its-kind Integration</h3>
              <p>First to combine AI + Blockchain + IoT + Geo-fencing + Band Connectivity</p>
            </div>
            <div className="innovation-card">
              <h3>Offline-first Safety</h3>
              <p>Works without internet in remote areas</p>
            </div>
            <div className="innovation-card">
              <h3>Proactive System</h3>
              <p>Prevents incidents, not just reacts</p>
            </div>
            <div className="innovation-card">
              <h3>Crowd Heatmaps</h3>
              <p>Smarter planning & safer routes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Story Section */}
      <section className="demo-story-section">
        <div className="container">
          <h2 className="section-title">Real-World Examples</h2>
          
          {/* Rajasthan Example */}
          <div className="story-card">
            <h3>🏰 Rajasthan Fort Exploration</h3>
            <p className="story-scenario">"You're exploring a remote fort in Rajasthan where mobile internet is weak..."</p>
            <div className="comparison">
              <div className="without">
                <h4>❌ Without SafeTourAI:</h4>
                <p>No alerts, unsafe zones go unnoticed</p>
              </div>
              <div className="with">
                <h4>✅ With SafeTourAI:</h4>
                <p>Your band vibrates instantly, warning about overcrowding & suggesting safe paths — even offline</p>
              </div>
            </div>
          </div>

          {/* North-East Example */}
          <div className="story-card">
            <h3>🌿 North-Eastern India Adventure</h3>
            <p className="story-scenario">"Imagine you are traveling in Meghalaya's Living Root Bridges or exploring Arunachal Pradesh monasteries..."</p>
            <div className="comparison">
              <div className="without">
                <h4>❌ Problem (Without SafeTourAI):</h4>
                <ul>
                  <li>Internet signal drops in deep valleys and forests</li>
                  <li>Tourists can get lost on trekking routes</li>
                  <li>No alerts about sudden crowd surges or unsafe shortcuts</li>
                  <li>In emergency, no quick way to share location</li>
                </ul>
              </div>
              <div className="with">
                <h4>✅ Solution (With SafeTourAI):</h4>
                <ul>
                  <li>Band device works offline, giving real-time vibration + screen alerts</li>
                  <li>AI-powered geo-fencing warns about risky or restricted zones</li>
                  <li>Safe alternate routes suggested instantly</li>
                  <li>Emergency SOS via IoT network to nearest support centers</li>
                </ul>
              </div>
            </div>
            <div className="usp-highlight">
              <strong>USP Highlight:</strong> SafeTourAI ensures safety even in remote hills, forests, and border regions of North-Eastern India — where internet connectivity is often unavailable.
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-choose-section">
        <div className="container">
          <h2 className="section-title">Why Choose SafeTourAI?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">✅</div>
              <p>Works online & offline (via band)</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">✅</div>
              <p>Global-first AI + Blockchain safety platform</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">✅</div>
              <p>Low connectivity? No problem</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">✅</div>
              <p>Backed by trusted open platforms & guidelines</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="final-cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Travel India safely – with or without internet.</h2>
            <div className="final-cta-buttons">
              <Link to="/register" className="cta-btn primary large">👉 Sign Up Free</Link>
              <button className="cta-btn secondary large">👉 Partner With Us</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <h3>SafeTourAI</h3>
              <p>Your AI-powered travel safety companion</p>
            </div>
            <div className="footer-links">
              <Link to="/about">About</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 SafeTourAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
