import React, { useEffect, useState, useMemo } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import logo from './logo.svg';
import './App.css';

function Home() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = useMemo(() => 'http://localhost:8000/api/workspaces', []);

  useEffect(() => {
    let cancelled = false;
    async function fetchWorkspaces() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(API_URL, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const json = await response.json();
        const data = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        if (!cancelled) setWorkspaces(data);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load workspaces');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchWorkspaces();
    return () => {
      cancelled = true;
    };
  }, [API_URL]);

  const navigate = useNavigate();

  return (
    <div className="ws-app">
      <header className="ws-header">
        <div className="ws-header-left">
          <img src={logo} alt="Workspace Booking" className="ws-logo" />
          <span className="ws-brand">Workspace Booking</span>
        </div>
        <nav className="ws-nav">
          <ul className="ws-nav-list">
            <li className="ws-nav-item"><a href="#home">Home</a></li>
            <li className="ws-nav-item"><button className="ws-dropdown-toggle" onClick={() => navigate('/about')}>About</button></li>
            <li className="ws-nav-item ws-dropdown">
              <button className="ws-dropdown-toggle" aria-haspopup="true" aria-expanded="false">Categories</button>
              <ul className="ws-dropdown-menu" role="menu">
                <li role="menuitem"><a href="#cat1">Single Desk</a></li>
                <li role="menuitem"><a href="#cat2">Meeting Room</a></li>
                <li role="menuitem"><a href="#cat3">Meeting Desk</a></li>
              </ul>
            </li>
          </ul>
        </nav>
      </header>

      <main className="ws-main">
        <section className="ws-hero">
          <h1 className="ws-hero-title">Find your ideal workspace</h1>
          <p className="ws-hero-subtitle">Discover professional environments designed for productivity and comfort.</p>
        </section>

        {loading && (
          <section className="ws-grid" aria-label="Workspace listings loading">
            {Array.from({ length: 6 }).map((_, i) => (
              <article key={i} className="ws-card" aria-busy="true">
                <header className="ws-card-header">
                  <h2 className="ws-card-title" style={{ background: '#eef2ff', height: 18, width: '60%' }} />
                </header>
                <div className="ws-card-media" />
                <footer className="ws-card-footer">
                  <p className="ws-card-desc" style={{ background: '#f3f4f6', height: 14, width: '80%' }} />
                  <div className="ws-button ws-button-primary" style={{ opacity: 0.6 }}>Loading</div>
                </footer>
              </article>
            ))}
          </section>
        )}

        {!loading && error && (
          <div role="alert" style={{ background: '#fee2e2', color: '#7f1d1d', border: '1px solid #fecaca', padding: 12, borderRadius: 8 }}>
            Failed to load workspaces: {error}
          </div>
        )}

        {!loading && !error && (
          <section className="ws-grid" aria-label="Workspace listings">
            {workspaces.length === 0 && (
              <div style={{ color: '#6b7280' }}>No workspaces found.</div>
            )}
            {workspaces.map((w) => {
              const name = w.name || w.title || 'Workspace';
              const description = w.description || w.details || '';
              const rawImage = w.image_url || w.image || '';
              const image = (() => {
                if (!rawImage) return 'https://picsum.photos/seed/placeholder/640/400';
                const isAbsolute = /^https?:\/\//i.test(rawImage);
                if (isAbsolute) return rawImage;
                const cleaned = rawImage.replace(/^\/+/, '');
                // Assume Laravel public storage symlink: http://localhost:8000/storage/{path}
                return `http://localhost:8000/${cleaned.startsWith('storage/') ? cleaned : 'storage/' + cleaned}`;
              })();
              const isUnavailable = (w.status === 0) || (typeof w.status === 'string' && w.status === '0');
              return (
                <article key={w.id ?? name} className="ws-card">
                  <header className="ws-card-header">
                    <h2 className="ws-card-title">{name}</h2>
                  </header>
                  <div className="ws-card-media">
                    <img src={image} alt={name} onError={(e) => { e.currentTarget.src = 'https://picsum.photos/seed/placeholder/640/400'; }} />
                  </div>
                  <footer className="ws-card-footer">
                    <p className="ws-card-desc">{description}</p>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {isUnavailable ? (
                        <button className="ws-button ws-button-danger" type="button" disabled title="Currently unavailable">Unavailable</button>
                      ) : (
                        <button className="ws-button ws-button-primary" type="button" onClick={() => navigate(`/booking/${encodeURIComponent(name)}?wid=${encodeURIComponent(w.id ?? '')}`)}>Book</button>
                      )}
                    </div>
                  </footer>
                </article>
              );
            })}
          </section>
        )}
      </main>

      <footer className="ws-footer">
        <small>© {new Date().getFullYear()} Workspace Booking. All rights reserved.</small>
      </footer>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState('');
  const [activeTab, setActiveTab] = useState('add-workspace');
  const BOOKINGS_API_URL = useMemo(() => 'http://localhost:8000/api/bookings', []);
  const BOOKING_STATUS_API_BASE = useMemo(() => 'http://localhost:8000/api/bookings/status', []);
  const [statusNotice, setStatusNotice] = useState('');
  const [statusError, setStatusError] = useState('');
  const [rowUpdating, setRowUpdating] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function fetchBookings() {
      setBookingsLoading(true);
      setBookingsError('');
      try {
        const response = await fetch(BOOKINGS_API_URL, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }
        const json = await response.json();
        const raw = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        // Normalize to the table shape
        const normalized = raw.map((b) => ({
          id: b.id ?? b.booking_id ?? '',
          workspace: b.workspace?.name || b.workspace_name || b.workspace || b.workspace_title || b.workspace_id || '',
          username: b.username || b.user_name || b.name || b.user?.name || '',
          email: b.email || b.user?.email || '',
          start_time: b.start_time || b.start || '',
          end_time: b.end_time || b.end || '',
          status: (b.status || 'pending').toString().toLowerCase(),
        }));
        if (!cancelled) setBookings(normalized);
      } catch (err) {
        if (!cancelled) setBookingsError(err?.message || 'Failed to load bookings');
      } finally {
        if (!cancelled) setBookingsLoading(false);
      }
    }
    fetchBookings();
    return () => {
      cancelled = true;
    };
  }, [BOOKINGS_API_URL]);

  async function handleStatusChange(id, newStatus) {
    setStatusNotice('');
    setStatusError('');
    setRowUpdating((prev) => ({ ...prev, [id]: true }));
    // optimistic update
    const prevSnapshot = bookings;
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b)));
    try {
      const form = new FormData();
      form.set('status', newStatus);
      const res = await fetch(`${BOOKING_STATUS_API_BASE}/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: form,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || `Request failed: ${res.status}`);
      }
      const updated = data?.data || {};
      setBookings((prev) => prev.map((b) => (b.id === id ? {
        ...b,
        status: (updated.status || newStatus || 'pending').toString().toLowerCase(),
        username: updated.username ?? b.username,
        email: updated.email ?? b.email,
        start_time: updated.start_time ?? b.start_time,
        end_time: updated.end_time ?? b.end_time,
        workspace: updated.workspace?.name || updated.workspace_name || b.workspace,
      } : b)));
      setStatusNotice('Booking status updated successfully.');
    } catch (err) {
      setStatusError(err?.message || 'Failed to update booking status');
      // revert snapshot
      setBookings(prevSnapshot);
    } finally {
      setRowUpdating((prev) => ({ ...prev, [id]: false }));
      setTimeout(() => {
        setStatusNotice('');
      }, 2500);
    }
  }

  function handleCreateWorkspace(e) {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const payload = new FormData();
    payload.set('title', form.get('title'));
    payload.set('description', form.get('description'));
    payload.set('status', form.get('status'));
    const file = form.get('image');
    if (file && typeof file === 'object' && file.name) {
      payload.set('image', file);
    }

    setSubmitting(true);
    fetch('http://localhost:8000/api/workspaces/store', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: payload,
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.message || `Request failed: ${res.status}`);
        }
        setSubmitSuccess('Workspace added successfully.');
        formEl.reset();
      })
      .catch((err) => setSubmitError(err?.message || 'Failed to add workspace'))
      .finally(() => setSubmitting(false));
  }

  const renderContent = () => {
    if (activeTab === 'add-workspace') {
      return (
        <div>
          <section className="ws-hero ws-animate-enter" style={{ marginBottom: 12 }}>
            <h1 className="ws-hero-title">Add Workspace</h1>
            <p className="ws-hero-subtitle">Create a new workspace card for users to book.</p>
          </section>
          <section>
            <form className="ws-form ws-animate-pop" onSubmit={handleCreateWorkspace}>
              <div className="ws-form-row">
                <label className="ws-label" htmlFor="title">Title</label>
                <input className="ws-input" id="title" name="title" type="text" placeholder="e.g. Cozy Workspace" required />
              </div>
              <div className="ws-form-row">
                <label className="ws-label" htmlFor="description">Description</label>
                <textarea className="ws-input" id="description" name="description" rows="4" placeholder="Short description" required></textarea>
              </div>
              <div className="ws-form-two">
                <div className="ws-form-row">
                  <label className="ws-label" htmlFor="status">Status</label>
                  <select className="ws-input" id="status" name="status" defaultValue="1" required>
                    <option value="1">Available</option>
                    <option value="0">Unavailable</option>
                  </select>
                </div>
                <div className="ws-form-row">
                  <label className="ws-label" htmlFor="image">Image</label>
                  <input className="ws-input" id="image" name="image" type="file" accept="image/*" />
                </div>
              </div>
              {submitError && (
                <div role="alert" style={{ background: '#fee2e2', color: '#7f1d1d', border: '1px solid #fecaca', padding: 10, borderRadius: 8 }}>{submitError}</div>
              )}
              {submitSuccess && (
                <div role="status" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: 10, borderRadius: 8 }}>{submitSuccess}</div>
              )}
              <div className="ws-form-actions">
                <button type="submit" className="ws-button ws-button-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Workspace'}</button>
              </div>
            </form>
          </section>
        </div>
      );
    } else if (activeTab === 'list-bookings') {
      return (
        <div>
          <section className="ws-hero ws-animate-enter" style={{ marginBottom: 12 }}>
            <h1 className="ws-hero-title">List of Bookings</h1>
            <p className="ws-hero-subtitle">Manage and view all workspace bookings.</p>
          </section>
          <section className="ws-animate-enter">
            {statusError && (
              <div role="alert" style={{ background: '#fee2e2', color: '#7f1d1d', border: '1px solid #fecaca', padding: 10, borderRadius: 8, marginBottom: 8 }}>{statusError}</div>
            )}
            {statusNotice && (
              <div role="status" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: 10, borderRadius: 8, marginBottom: 8 }}>{statusNotice}</div>
            )}
            <div className="ws-table-wrap">
              <table className="ws-table" aria-label="Recent bookings demo">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Workspace</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingsLoading && (
                    <tr>
                      <td colSpan="7" style={{ color: '#6b7280' }}>Loading bookings...</td>
                    </tr>
                  )}
                  {!bookingsLoading && bookingsError && (
                    <tr>
                      <td colSpan="7" style={{ color: '#7f1d1d', background: '#fee2e2' }}>Failed to load bookings: {bookingsError}</td>
                    </tr>
                  )}
                  {!bookingsLoading && !bookingsError && bookings.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ color: '#6b7280' }}>No bookings found.</td>
                    </tr>
                  )}
                  {!bookingsLoading && !bookingsError && bookings.map((b) => (
                    <tr key={b.id}>
                      <td>{b.id}</td>
                      <td>{b.workspace}</td>
                      <td>{b.username}</td>
                      <td>{b.email}</td>
                      <td>{b.start_time}</td>
                      <td>{b.end_time}</td>
                      <td>
                        <select
                          className="ws-input"
                          value={b.status}
                          onChange={(e) => handleStatusChange(b.id, e.target.value)}
                          style={{ padding: '6px 8px', height: 34 }}
                          disabled={!!rowUpdating[b.id]}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      );
    }
  };

  return (
    <div className="dashboard-app">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="user-avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="white"/>
                <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="white"/>
              </svg>
            </div>
            <div className="user-info">
              <div className="user-name">JOHN DON</div>
              <div className="user-email">johndon@company.com</div>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            <li className="sidebar-item">
              <button 
                className={`sidebar-link ${activeTab === 'add-workspace' ? 'active' : ''}`}
                onClick={() => setActiveTab('add-workspace')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Add Workspace
              </button>
            </li>
            <li className="sidebar-item">
              <button 
                className={`sidebar-link ${activeTab === 'list-bookings' ? 'active' : ''}`}
                onClick={() => setActiveTab('list-bookings')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                List of Booking
              </button>
            </li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button className="back-button" onClick={() => navigate('/')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Site
          </button>
        </div>
      </div>
      <div className="dashboard-main">
        <header className="dashboard-header">
          <h1 className="dashboard-title">Dashboard User</h1>
        </header>
        <main className="dashboard-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

function BookingPage() {
  const { name } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const selectedName = decodeURIComponent(name || '');
  const workspaceId = params.get('wid') || '';
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const start = new Date(form.get('start_time'));
    const end = new Date(form.get('end_time'));
    if (Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && end <= start) {
      alert('End time must be after start time.');
      return;
    }
    // Build FormData to match your Postman example
    const payload = new FormData();
    payload.set('workspace_id', form.get('workspace_id'));
    payload.set('start_time', form.get('start_time'));
    payload.set('end_time', form.get('end_time'));
    payload.set('username', form.get('name'));
    payload.set('email', form.get('email'));
    payload.set('notes', form.get('notes'));

    setSubmitting(true);
    fetch('http://localhost:8000/api/bookings/store', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        // Do NOT set Content-Type for FormData; browser adds correct boundary
      },
      body: payload,
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.message || `Request failed: ${res.status}`);
        }
        setSubmitSuccess('Booking created successfully.');
        // Optionally reset fields except the selected workspace
        formEl.reset();
      })
      .catch((err) => {
        setSubmitError(err?.message || 'Failed to create booking');
      })
      .finally(() => setSubmitting(false));
  }
  return (
    <div className="ws-app">
      <header className="ws-header">
        <div className="ws-header-left">
          <img src={logo} alt="Workspace Booking" className="ws-logo" />
          <span className="ws-brand">Workspace Booking</span>
        </div>
        <nav className="ws-nav">
          <ul className="ws-nav-list">
            <li className="ws-nav-item"><button className="ws-dropdown-toggle" onClick={() => window.history.length > 1 ? window.history.back() : window.location.assign('/')}>Back to Site</button></li>
          </ul>
        </nav>
      </header>
      <main className="ws-main">
        <section className="ws-hero ws-animate-enter" style={{ marginBottom: 12 }}>
          <h1 className="ws-hero-title">Book a workspace</h1>
          <p className="ws-hero-subtitle">Fill in the details to request your booking.</p>
        </section>
        <section>
          <form className="ws-form ws-animate-pop" onSubmit={handleSubmit}>
            <div className="ws-form-row">
              <label className="ws-label" htmlFor="workspace">Workspace</label>
              <input className="ws-input" id="workspace" name="workspace" type="text" placeholder="Selected workspace" defaultValue={selectedName} readOnly required />
              <input type="hidden" name="workspace_id" value={workspaceId} />
              <input type="hidden" name="status" value="pending" />
            </div>
            <div className="ws-form-row">
              <label className="ws-label" htmlFor="name">Full Name</label>
              <input className="ws-input" id="name" name="name" type="text" placeholder="Your name" required />
            </div>
            <div className="ws-form-two">
              <div className="ws-form-row">
                <label className="ws-label" htmlFor="email">Email</label>
                <input className="ws-input" id="email" name="email" type="email" placeholder="you@example.com" required />
              </div>
              <div className="ws-form-row">
                <label className="ws-label" htmlFor="phone">Phone</label>
                <input className="ws-input" id="phone" name="phone" type="tel" placeholder="e.g. +1 555 123 4567" required />
              </div>
            </div>
            <div className="ws-form-two">
              <div className="ws-form-row">
                <label className="ws-label" htmlFor="start_time">Start time</label>
                <input className="ws-input" id="start_time" name="start_time" type="datetime-local" required />
              </div>
              <div className="ws-form-row">
                <label className="ws-label" htmlFor="end_time">End time</label>
                <input className="ws-input" id="end_time" name="end_time" type="datetime-local" required />
              </div>
            </div>
            <div className="ws-form-row">
              <label className="ws-label" htmlFor="notes">Notes</label>
              <textarea className="ws-input" id="notes" name="notes" rows="4" placeholder="Any special requirements"></textarea>
            </div>
            {submitError && (
              <div role="alert" style={{ background: '#fee2e2', color: '#7f1d1d', border: '1px solid #fecaca', padding: 10, borderRadius: 8 }}>{submitError}</div>
            )}
            {submitSuccess && (
              <div role="status" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: 10, borderRadius: 8 }}>{submitSuccess}</div>
            )}
            <div className="ws-form-actions">
              <button type="submit" className="ws-button ws-button-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Booking'}</button>
            </div>
          </form>
        </section>
      </main>
      <footer className="ws-footer">
        <small>© {new Date().getFullYear()} Workspace Booking. All rights reserved.</small>
      </footer>
    </div>
  );
}

function AboutPage() {
  const navigate = useNavigate();
  const gallery = [
    'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1551292831-023188e78222?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507209696998-3c532be9b2b2?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1557800636-894a64c1696f?q=80&w=1200&auto=format&fit=crop',
  ];
  return (
    <div className="ws-app">
      <header className="ws-header">
        <div className="ws-header-left">
          <img src={logo} alt="Workspace Booking" className="ws-logo" />
          <span className="ws-brand">About Workspace Booking</span>
        </div>
        <nav className="ws-nav">
          <ul className="ws-nav-list">
            <li className="ws-nav-item"><button className="ws-dropdown-toggle" onClick={() => navigate('/')}>Back to Site</button></li>
          </ul>
        </nav>
      </header>
      <main className="ws-main">
        <section className="ws-hero ws-animate-enter" style={{ marginBottom: 12 }}>
          <h1 className="ws-hero-title">Workspaces built for focus and collaboration</h1>
          <p className="ws-hero-subtitle">Book desks, meeting rooms, and creative corners tailored to your needs.</p>
        </section>
        <section className="ws-about">
          <div className="ws-about-text">
            <p>
              Workspace Booking helps teams and individuals find flexible work environments. Whether you need a quiet
              desk for deep work, a modern meeting room for client calls, or a collaborative space for brainstorming,
              our curated listings make it simple to discover and reserve the right place at the right time.
            </p>
            <p>
              We partner with trusted venues to provide high-quality amenities: fast Wi‑Fi, ergonomic chairs, whiteboards,
              projectors, and more. Reserve on-demand, manage your bookings, and stay productive wherever you are.
            </p>
          </div>
          <div className="ws-gallery">
            {gallery.map((src, i) => (
              <figure key={src} className="ws-gallery-item">
                <img src={src} alt={`Workspace sample ${i + 1}`} />
              </figure>
            ))}
          </div>
        </section>
      </main>
      <footer className="ws-footer">
        <small>© {new Date().getFullYear()} Workspace Booking. All rights reserved.</small>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/booking/:name" element={<BookingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  );
}

export default App;
