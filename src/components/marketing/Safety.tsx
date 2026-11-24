import { useState } from 'react';

const ROLES = [
  {
    id: 'clerk',
    title: 'Clerk',
    body: 'Registers walk-ins and issues queue tokens. Cannot set clinical priority or approve a booking.',
  },
  {
    id: 'nurse',
    title: 'Nurse',
    body: 'Validates priority and records warning signs with the observations behind them. Cannot commit a booking.',
  },
  {
    id: 'shift-lead',
    title: 'Shift lead',
    body: 'Approves or rejects a proposed booking. The record stores their identity and reason. An admin can do the same.',
  },
];

const BOUNDARIES = [
  { title: 'No diagnosis', body: 'Mzima does not diagnose patients or determine clinical urgency on its own.' },
  { title: 'No autonomous triage', body: 'Facility rules surface priority. A nurse still validates it.' },
  { title: 'No silent changes', body: 'Queue and booking changes require an authenticated clinician.' },
  { title: 'Fail closed', body: 'No matching slot, or stale capacity, stops the proposal instead of guessing.' },
];

export function Safety() {
  const [roleId, setRoleId] = useState(ROLES[0].id);
  const role = ROLES.find((item) => item.id === roleId) ?? ROLES[0];

  return (
    <section id="safety" className="landing-section" aria-labelledby="safety-title">
      <div className="landing-wrap">
        <p className="landing-kicker">Safety</p>
        <h2 className="landing-title" id="safety-title">
          What each role can do.
        </h2>
        <p className="landing-lead">
          Select a role. The panel states the work that role may perform, and the limits that stay in place for
          every role.
        </p>
        <div className="safety-layout">
          <div className="role-list" role="group" aria-label="Roles">
            {ROLES.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={item.id === role.id}
                onClick={() => setRoleId(item.id)}
              >
                {item.title}
              </button>
            ))}
          </div>
          <div className="safety-panel" aria-live="polite">
            <h3>{role.title}</h3>
            <p className="safety-copy">{role.body}</p>
          </div>
        </div>
        <div className="boundary-grid">
          {BOUNDARIES.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
