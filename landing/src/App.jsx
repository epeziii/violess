import React, { useState, useEffect } from 'react';
import violessIcon from './assets/violessicon.png';

// Custom Simple Inline SVG Icons
const ApkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.6 2c-.3 0-.6.2-.7.5l-.8 1.9h-6.2l-.8-1.9c-.1-.3-.4-.5-.7-.5-.4 0-.7.3-.7.7 0 .1.1.3.1.4l.9 2h-.4c-2.4 0-4.4 1.8-4.7 4.1h17c-.3-2.3-2.3-4.1-4.7-4.1h-.4l.9-2c.1-.1.1-.3.1-.4 0-.4-.3-.7-.7-.7zm-8.6 7c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm8 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm-13 3.6v4.6c0 1 1 1.8 2 1.8h1v3.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5v-3.5h4v3.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5v-3.5h1c1 0 2-.8 2-1.8v-4.6h-16.5z" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 11 2 2 4-4" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const MessageSquareIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const BookOpenIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const apkDownloadUrl = 'https://expo.dev/artifacts/eas/Z83duh3C9o0GDpoOBFVsG0GR1N4VZiZOXkazUVDMkWg.apk';

export default function App() {
  const [activeTab, setActiveTab] = useState('sos');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqActive, setFaqActive] = useState(null);



  const toggleFaq = (index) => {
    setFaqActive(faqActive === index ? null : index);
  };

  return (
    <>
      {/* ── Navbar Menu ── */}
      <nav className="navbar">
        <div className="container navbar-content">
          <div className="logo-container">
            <div className="logo-icon">
              <img src={violessIcon} alt="Violess logo" />
            </div>
            Violess
          </div>

          <button
            className="menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <ul className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
            <li><a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a></li>
            <li><a href="#about" onClick={() => setMobileMenuOpen(false)}>Privacy & Safety</a></li>
            <li><a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a></li>
            <li><a href={apkDownloadUrl} className="nav-btn" download="violess.apk" onClick={() => setMobileMenuOpen(false)}>Download APK</a></li>
          </ul>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <header className="hero">
        <div className="container hero-grid">
          <div className="hero-text">
            <span className="badge-new">Version 1.0 Available Now</span>
            <h1 className="hero-title">
              Your Shield Against Violence. <span>Speak Up, Stay Safe.</span>
            </h1>
            <p className="hero-desc">
              Violess connects citizens directly with Mabayuan Barangay responders. Trigger instant SOS distress signals, securely track report investigations, and find resources.
            </p>
            <div className="hero-buttons">
              <a href={apkDownloadUrl} className="app-btn" download="violess.apk">
                <div className="app-btn-icon"><ApkIcon /></div>
                <div className="app-btn-text">
                  <span>Direct Download</span>
                  <strong>Get Android APK</strong>
                </div>
              </a>
            </div>
          </div>

        </div>
      </header>

      {/* ── Features Showcase ── */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">Built to protect. Designed to support.</h2>
            <p className="section-desc">
              Violess combines privacy and support to keep you protected and in control.
            </p>
          </div>

          <div className="features-layout">
            <div className="features-tabs">
              <button
                className={`tab-btn ${activeTab === 'sos' ? 'active' : ''}`}
                onClick={() => setActiveTab('sos')}
              >
                <div className="tab-icon"><AlertTriangleIcon /></div>
                <div className="tab-details">
                  <h4>SOS Emergency Alarm</h4>
                  <p>Hold the red button for 3 seconds to immediately ping barangay mabayuan and notify trusted contacts.</p>
                </div>
              </button>

              <button
                className={`tab-btn ${activeTab === 'track' ? 'active' : ''}`}
                onClick={() => setActiveTab('track')}
              >
                <div className="tab-icon"><SearchIcon /></div>
                <div className="tab-details">
                  <h4>Secure Incident Tracking</h4>
                  <p>Submit reports with evidence attachments (photos/records) and monitor the live progress of case responders.</p>
                </div>
              </button>

              <button
                className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                <div className="tab-icon"><MessageSquareIcon /></div>
                <div className="tab-details">
                  <h4>SafeTalk AI chatbot</h4>
                  <p>SafeTalk AI provides online support to help you navigate difficult situations with guidance when you need it.</p>
                </div>
              </button>

              <button
                className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
                onClick={() => setActiveTab('resources')}
              >
                <div className="tab-icon"><BookOpenIcon /></div>
                <div className="tab-details">
                  <h4>Resource Directories</h4>
                  <p>Examine Philippine laws, find nearby shelters, and get physical support information.</p>
                </div>
              </button>
            </div>

            {/* Interactive Phone Mockup */}
            <div className="mockup-container">
              <div className="phone-shadow"></div>
              <div className="phone-frame">
                <div className="phone-notch"></div>
                <div className="phone-screen">

                  {/* Phone Header */}
                  <div className={`phone-header ${activeTab === 'sos' ? 'phone-header-sos' : ''} ${activeTab === 'chat' ? 'phone-header-chat' : ''}`}>
                    <span>Violess App</span>
                    <span>10:48 AM</span>
                  </div>

                  {/* Switchable Phone Interface based on App Tab */}
                  {activeTab === 'sos' && (
                    <div className="mock-sos-root">
                      <p className="mock-sos-instruct">Press and hold button to send SOS</p>
                      <div className="mock-sos-btn-outer">
                        <div className="mock-sos-btn-inner">
                          <span style={{ fontSize: '24px' }}>📣</span>
                          <span style={{ fontSize: '11px', marginTop: '2px' }}>SOS</span>
                        </div>
                      </div>
                      <div className="mock-sos-flow">
                        <div>📡 Barangay Duty alerted</div>
                        <div>👥 3 Contacts notified</div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'track' && (
                    <div className="phone-content">
                      <div className="mock-greet">Incident Report Tracker</div>
                      <div className="mock-name">Case Status Check</div>
                      <span className="mock-case-badge">Case #819 — Pending Review</span>

                      <div className="mock-timeline">
                        <div className="mock-timeline-item done">
                          <div className="mock-timeline-title">Submitted</div>
                          <div className="mock-timeline-desc">Report uploaded securely.</div>
                        </div>
                        <div className="mock-timeline-item done">
                          <div className="mock-timeline-title">Assigned responding officer</div>
                          <div className="mock-timeline-desc">Barangay investigator assigned.</div>
                        </div>
                        <div className="mock-timeline-item">
                          <div className="mock-timeline-title">Investigation Active</div>
                          <div className="mock-timeline-desc">Verifying details on site.</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'chat' && (
                    <div className="phone-content mock-chat-root">
                      <div className="mock-greet">SafeTalk Private AI</div>

                      <div className="mock-chat-msgs">
                        <div className="mock-msg ai">
                          Hello. I'm a safe, offline-capable AI support agent. Your chats are not stored. How can I guide you?
                        </div>
                        <div className="mock-msg user">
                          I need to know standard protocol for reporting domestic abuse.
                        </div>
                        <div className="mock-msg ai">
                          Under RA 9262, you can seek a Barangay Protection Order (BPO) immediately. Click "SOS" or call the hotline.
                        </div>
                      </div>

                      <div className="mock-chat-input">
                        Type message
                      </div>
                    </div>
                  )}

                  {activeTab === 'resources' && (
                    <div className="phone-content" style={{ textAlign: 'left' }}>
                      <div className="mock-greet">Information & Hotlines</div>
                      <div className="mock-name">Directory & Laws</div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                        <div style={{ border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', background: 'var(--surface)' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '10px' }}>📞 Emergency Hotlines</div>
                          <p style={{ fontSize: '9px', color: 'var(--text-muted)' }}>National PNP hotlines & rescue responders.</p>
                        </div>
                        <div style={{ border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', background: 'var(--surface)' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '10px' }}>⚖️ RA 9262 Guidebook</div>
                          <p style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Know your legal rights under domestic protection laws.</p>
                        </div>
                        <div style={{ border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', background: 'var(--surface)' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '10px' }}>🏥 Partner Shelters</div>
                          <p style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Safehouses, legal aid groups and local support centres.</p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Privacy & Safety Features ── */}
      <section id="about" className="privacy-section">
        <div className="container privacy-grid">
          <div className="privacy-left">
            <span className="privacy-badge">Privacy & Safety</span>
            <h2 className="privacy-title">Report on your terms.</h2>
            <p className="privacy-desc">
              Violess gives you control over how you share your identity when reporting. Choose to submit anonymously or include your details so responders can follow up with you.
            </p>
            <ul className="features-list">
              <li>
                <span className="check-icon">✓</span>
                <div>
                  <strong>Anonymous Reporting:</strong> Submit a report without revealing your identity when you need an added layer of privacy.
                </div>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <div>
                  <strong>Identified Reporting:</strong> Share your details when you want responders to contact you and provide updates about your report.
                </div>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <div>
                  <strong>Connected Support:</strong> An internet connection is required to send reports, SOS alerts, and receive case updates.
                </div>
              </li>
            </ul>
          </div>

          <div className="privacy-right">
            <div className="privacy-card">
              <div className="privacy-card-icon"><LockIcon /></div>
              <h4>Choose What You Share</h4>
              <p>Decide whether to report anonymously or provide your information for follow-up from responders.</p>
            </div>
            <div className="privacy-card">
              <div className="privacy-card-icon"><EyeOffIcon /></div>
              <h4>Safety Through Connection</h4>
              <p>Violess uses the internet to deliver reports and alerts to the barangay and keep you informed about case progress.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section id="faq" className="faq-section">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">Common Questions</h2>
            <p className="section-desc">Answers to common inquiries regarding how Violess processes your alerts and reports.</p>
          </div>

          <div className="faq-list">
            {[
              {
                q: "Is Violess completely free to use?",
                a: "Yes. Violess is free to download and use. Hotlines, chatbot guidance, safety directories, and local incident tracking do not require any paid subscription."
              },
              {
                q: "How does the SOS button notify my local Barangay?",
                a: "Once held for 3 seconds, the alert is sent directly to the Violess Barangay Dashboard. Duty response officers receive audio alerts and a geo-map pin to dispatch assistance immediately."
              },
              {
                q: "Can I submit warning reports anonymously?",
                a: "Yes. When reporting an incident, you can select 'Report Anonymously'. Responding officers can view details and respond, but they will not see your registered name or ID credentials."
              }
            ].map((item, index) => (
              <div key={index} className={`faq-item ${faqActive === index ? 'active' : ''}`}>
                <button className="faq-question" onClick={() => toggleFaq(index)}>
                  {item.q}
                  <span className="faq-icon">+</span>
                </button>
                <div className="faq-answer">
                  <div className="faq-answer-inner">
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Download banner ── */}
      <section id="download" className="cta-banner">
        <div className="container cta-content">
          <h2 className="cta-title">Take Control of Your Safety Today</h2>
          <p className="cta-desc">
            Download the Violess app now for Android and iOS devices. Always have an emergency trigger at your fingertips.
          </p>
          <div className="cta-buttons">
            <a href={apkDownloadUrl} className="app-btn" download="violess.apk">
              <div className="app-btn-icon"><ApkIcon /></div>
              <div className="app-btn-text">
                <span>Direct Download</span>
                <strong>Get Android APK</strong>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <div className="footer-logo">
              <span>Violess</span> Landing
            </div>
            <p className="footer-desc">
              Dedicated to minimizing domestic abuse and supporting responders and victims with high-security technological solutions.
            </p>

            {/* Blank segment for footer spacing */}
          </div>

          <div>
            <h4 className="footer-links-title">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#about">Privacy & Safety</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#download">Download Mobile App</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-links-title">Legal & Security</h4>
            <ul className="footer-links">
              <li><a href="#" onClick={(e) => { e.preventDefault(); alert("Violess processes reports anonymously. BIometric local keys are stored strictly in client keychain under RA 10173 compliance."); }}>Privacy Policy</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); alert("This application is for emergency reporting and support directory only. Always contact local defense services directly in life-threatening scenarios."); }}>Terms of Service</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); alert("All source code client-side encryption modules comply with local barangay safety enforcement parameters."); }}>Security Disclosure</a></li>
            </ul>
          </div>
        </div>

        <div className="container footer-bottom">
          <p>© {new Date().getFullYear()} Violess Project. All rights reserved.</p>
          <p>Created to Support Local Responders and Prevent Domestic Abuse.</p>
        </div>
      </footer>
    </>
  );
}
