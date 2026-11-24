import { useState } from 'react';

const QUESTIONS = [
  {
    q: 'Is Mzima for live care?',
    a: 'No. It is a synthetic-data prototype. It is not approved for live care, and it is not a diagnostic system.',
  },
  {
    q: 'Who can approve a booking?',
    a: 'A shift lead or an admin. The decision records their identity and reason. An agent proposal stays proposed until that decision.',
  },
  {
    q: 'What can the MCP server read?',
    a: 'In this prototype the read-only tools are get_live_queue_summary and get_pending_appointment_reviews. They do not approve or book.',
  },
  {
    q: 'Can an agent book an appointment?',
    a: 'It can create a proposal for the earliest matching slot. It cannot approve the proposal or commit the booking.',
  },
  {
    q: 'What data does the prototype use?',
    a: 'Synthetic data only. Do not load real patient records.',
  },
];

export function Questions() {
  const [open, setOpen] = useState(0);

  return (
    <section id="questions" className="landing-section" aria-labelledby="questions-title">
      <div className="landing-wrap">
        <p className="landing-kicker">Questions</p>
        <h2 className="landing-title" id="questions-title">
          The boundaries, in short.
        </h2>
        <div className="faq-list">
          {QUESTIONS.map((item, index) => {
            const expanded = open === index;
            const panelId = `faq-panel-${index}`;
            return (
              <div className="faq-item" key={item.q}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => setOpen(expanded ? -1 : index)}
                >
                  <span>{item.q}</span>
                  <span aria-hidden="true">{expanded ? '−' : '+'}</span>
                </button>
                {expanded ? (
                  <p id={panelId} className="faq-panel">
                    {item.a}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
