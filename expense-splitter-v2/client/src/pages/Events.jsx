import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", date: "", location: "" });
  const [saving, setSaving] = useState(false);

  const loadEvents = () => {
    setLoading(true);
    api
      .get("/events")
      .then((res) => setEvents(res.data))
      .catch((err) => {
        console.error("LOAD EVENTS ERROR:", err.response?.data || err);
        setError(err.response?.data?.message || err.response?.data?.error || err.message || "Could not load events");
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadEvents, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/events", form);
      setForm({ title: "", description: "", date: "", location: "" });
      setShowForm(false);
      loadEvents();
    } catch (err) {
      console.error("CREATE EVENT ERROR:", err.response?.data || err);
      setError(err.response?.data?.message || err.response?.data?.error || err.message || "Could not create event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Your groups</h1>
          <p>Trips, dinners, or any group event you're splitting costs for.</p>
        </div>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ New group"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <form onSubmit={handleCreate}>
            <div className="field">
              <label htmlFor="title">Group name</label>
              <input
                id="title"
                required
                placeholder="e.g. Goa Trip 2026"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="date">Date</label>
                <input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  placeholder="Optional"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                rows={2}
                placeholder="Optional"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create event"}
            </button>
          </form>
        </div>
      )}

      {loading && <p className="loading-text">Loading…</p>}

      {!loading && events.length === 0 && (
        <div className="empty-state">
          <h3>No events yet</h3>
          <p>Create your first group event to start tracking shared expenses.</p>
        </div>
      )}

      <div className="event-grid">
        {events.map((ev) => (
          <Link key={ev._id} to={`/events/${ev._id}`} className="event-card">
            <h3>{ev.title}</h3>
            <div className="event-meta">
              {ev.date ? new Date(ev.date).toLocaleDateString() : "No date set"}
              {ev.location ? ` · ${ev.location}` : ""}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
