import { useState } from "react";
import api from "../api/client";
import Avatar from "./Avatar";

export default function ParticipantsTab({ eventId, participants, onChange }) {
  const [form, setForm] = useState({ name: "", email: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post(`/events/${eventId}/participants`, form);
      setForm({ name: "", email: "" });
      onChange();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add participant");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id) => {
    setError("");
    try {
      await api.delete(`/events/${eventId}/participants/${id}`);
      onChange();
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove participant");
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Add participant</div>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleAdd} className="field-row" style={{ alignItems: "flex-end" }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="pname">Name</label>
            <input
              id="pname"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="pemail">Email (optional — links a registered user)</label>
            <input
              id="pemail"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Adding…" : "Add"}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="section-title">Participants ({participants.length})</div>
        {participants.length === 0 ? (
          <p className="loading-text">No participants yet.</p>
        ) : (
          participants.map((p) => (
            <div className="ledger-row" key={p._id}>
              <div className="row-left">
                <Avatar name={p.name} />
                <div>
                  <div className="ledger-name">{p.name}</div>
                  {p.email && <div className="ledger-sub">{p.email}</div>}
                </div>
              </div>
              <button className="btn danger small" onClick={() => handleRemove(p._id)}>
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
