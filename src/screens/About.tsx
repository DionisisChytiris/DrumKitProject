import React from 'react';
import './styles/About.css';

export const AboutScreen: React.FC = () => {
  return (
    <div className="about-screen">
      <div className="screen-content">
        <div className="about-container">
          <h1>About Drum Kit Learning Platform</h1>
          
          <section className="about-section">
            <h2>🎯 Mission</h2>
            <p>
              Our mission is to make drumming accessible to everyone through an interactive,
              educational platform that combines virtual drum kits with structured learning exercises.
            </p>
          </section>

          <section className="about-section">
            <h2>✨ Features</h2>
            <div className="features-grid">
              <div className="feature-card">
                <h3>🥁 Virtual Drum Kit</h3>
                <p>
                  Play a realistic virtual drum kit with interactive toms, cymbals, and percussion.
                  Click or use keyboard shortcuts to play.
                </p>
              </div>
              <div className="feature-card">
                <h3>🎛️ Professional Mixer</h3>
                <p>
                  Control volume, pan, reverb, compression, and EQ for each drum individually.
                  Fine-tune your sound to perfection.
                </p>
              </div>
              <div className="feature-card">
                <h3>🎵 Pattern Sequencer</h3>
                <p>
                  Create and program drum patterns with our 16-step sequencer. Build complex
                  rhythms and loops with ease.
                </p>
              </div>
              <div className="feature-card">
                <h3>🎨 Kit Customization</h3>
                <p>
                  Swap drum samples and customize your kit. Choose from different snare, kick,
                  tom, and cymbal sounds.
                </p>
              </div>
              <div className="feature-card">
                <h3>📚 Learning Exercises</h3>
                <p>
                  Follow structured exercises designed for beginners to advanced players.
                  Learn patterns, timing, and technique.
                </p>
              </div>
              <div className="feature-card">
                <h3>🎯 Real-time Feedback</h3>
                <p>
                  Get visual and audio feedback as you play. Track your progress and improve
                  your drumming skills.
                </p>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>🛠️ Technology</h2>
            <p>
              Built with modern web technologies including React, TypeScript, and the Web Audio API
              for high-quality sound processing and effects.
            </p>
            <div className="tech-stack">
              <span className="tech-badge">React</span>
              <span className="tech-badge">TypeScript</span>
              <span className="tech-badge">Web Audio API</span>
              <span className="tech-badge">CSS3</span>
              <span className="tech-badge">Vite</span>
            </div>
          </section>

          <section className="about-section">
            <h2>📖 How to Use</h2>
            <ol className="instructions-list">
              <li>Navigate to the Home screen to access the drum kit</li>
              <li>Click on drums or use keyboard keys (Space, S, H, C, T, M, F, R) to play</li>
              <li>Use the Mixer tab to adjust individual drum settings</li>
              <li>Create patterns in the Sequencer tab</li>
              <li>Customize your kit in the Customize tab</li>
              <li>Follow exercises in the top panel to learn new patterns</li>
            </ol>
          </section>

          <section className="about-section">
            <h2>🎓 Learning Path</h2>
            <p>
              Start with beginner exercises to learn basic beats, then progress to intermediate
              patterns with fills and accents. Advanced exercises will challenge you with complex
              rhythms and time signatures.
            </p>
          </section>

          <section className="about-section">
            <h2>💡 Tips</h2>
            <ul className="tips-list">
              <li>Practice regularly to build muscle memory</li>
              <li>Start slow and gradually increase tempo</li>
              <li>Use the metronome (BPM control) to keep time</li>
              <li>Experiment with different kit configurations</li>
              <li>Record and listen to your patterns to improve</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
