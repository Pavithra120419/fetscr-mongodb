import React, { useState } from "react";
import "./Community.css";

export default function Community() {
  const [selectedVote, setSelectedVote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleVote = () => {
    if (selectedVote) {
      setSubmitted(true);
    } else {
      alert("Please select an option before submitting!");
    }
  };

  return (
    <div className="community-container">
      {/* Hero Section */}
      <section className="community-hero">
        <h1>Welcome to the fetscr Community 🚀</h1>
        <p>Connect, learn, and grow with other developers using fetscr.</p>
      </section>

      {/* Sections */}
      <section className="community-sections">
        <div className="community-card">
          <h2>💬 Discussions & Support</h2>
          <p>
            Ask questions, share tips, and help others. Join the conversation on our{" "}
            <a href="https://github.com" target="_blank" rel="noreferrer">GitHub Discussions</a>.
          </p>
        </div>
        <div className="community-card">
          <h2>📢 Announcements & Updates</h2>
          <p>
            Stay up to date with new releases, features, and bug fixes. Check out the latest updates on our{" "}
            <a href="https://github.com" target="_blank" rel="noreferrer">Release Notes</a>.
          </p>
        </div>
        <div className="community-card">
          <h2>🌟 Showcase</h2>
          <p>
            Share your projects built with fetscr. Inspire others and get featured in our community wall.
          </p>
        </div>
        <div className="community-card join-us-card">
          <h2>🔗 Join Us</h2>
          <p>Connect with fellow developers:</p>
          <ul>
            <li><a className="cta-btn" href="https://discord.com" target="_blank" rel="noreferrer">Join Discord</a></li>
            <li><a className="cta-btn" href="https://twitter.com" target="_blank" rel="noreferrer">Follow on Twitter</a></li>
            <li><a className="cta-btn" href="https://github.com" target="_blank" rel="noreferrer">Contribute on GitHub</a></li>
          </ul>
        </div>
        <div className="community-card learning-resources">
          <h2>📘 Learning Resources</h2>
          <p>Boost your skills with community-driven resources:</p>
          <ul>
            <li><a href="#">Official Documentation</a></li>
            <li><a href="#">Step-by-Step Tutorials</a></li>
            <li><a href="#">Community Blog Posts</a></li>
          </ul>
        </div>
        <div className="community-card">
          <h2>🤝 Collaboration</h2>
          <p>Looking for a project partner or mentor? Connect with community members.</p>
          <div className="collab-btns">
            <a className="cta-btn" href="#">Find a Mentor</a>
            <a className="cta-btn" href="#">Join a Project</a>
          </div>
        </div>
        <div className="community-card">
          <h2>📰 Community Spotlight</h2>
          <p>
            This month: <strong>Jane Doe</strong> built an AI-powered scraper using Fetscr 
            and integrated it with Notion. Check out her story 👉 <a href="#">Read More</a>
          </p>
        </div>
        <div className="community-card fun-zone-card">
          <h2>🎮 Fun Zone</h2>
          {!submitted ? (
            <>
              <p>Vote on this week’s poll:</p>
              <p className="poll-title"><strong>What’s your favorite Fetscr use case?</strong></p>
              <ul className="poll">
                {['Data scraping', 'SEO research', 'Market analysis'].map(option => (
                  <li key={option}>
                    <label className="poll-option">
                      <input
                        type="radio"
                        name="poll"
                        value={option}
                        checked={selectedVote === option}
                        onChange={e => setSelectedVote(e.target.value)}
                      />
                      <span className="option-tag">{option}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <button
                className={`cta-btn poll-submit-btn${selectedVote ? "" : " disabled"}`}
                onClick={handleVote}
                disabled={!selectedVote}
              >
                Submit
              </button>
            </>
          ) : (
            <p className="thank-you">
              🎉 Thanks for voting! You selected <strong>{selectedVote}</strong>.
            </p>
          )}
        </div>
        <div className="community-card">
          <h2>💡 Tips & Tricks</h2>
          <p>Quick hacks from the community to make your scraping smarter:</p>
          <ul>
            <li>Use filters to refine your queries</li>
            <li>Cache responses to save limits</li>
            <li>Always validate JSON responses</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
