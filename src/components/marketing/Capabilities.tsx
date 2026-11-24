const CAPABILITIES = [
  {
    title: 'MCP interoperability',
    summary: 'Read-only tools expose the live queue summary and pending appointment reviews.',
    detail:
      'Hospital applications call a narrow MCP interface. Authentication, permissions, and audit stay on that boundary.',
  },
  {
    title: 'Capacity-aware queues',
    summary: 'Walk-in registration, tokens, and waiting time follow facility ordering rules.',
    detail:
      'Red-flag visits go first, then waits at the 120-minute cap, then score. Arrival time and token number break ties.',
  },
  {
    title: 'Appointment proposals',
    summary: 'A deterministic slot tool can propose the earliest matching available slot.',
    detail:
      'An agent may record a proposal. The proposal stays proposed until a shift lead or admin decides.',
  },
  {
    title: 'Clinician approval',
    summary: 'A named, authenticated clinician approves or rejects before any booking is committed.',
    detail:
      'The decision stores that clinician’s identity and reason. No model overrides professional judgement.',
  },
  {
    title: 'Audit',
    summary: 'Queue changes and booking decisions keep a trace of who acted.',
    detail:
      'Staff interventions, proposals, and approvals are recorded so a later review can see the path.',
  },
  {
    title: 'Mock FHIR sync',
    summary: 'Approved requests can sync through a mock facility adapter.',
    detail:
      'The adapter uses an idempotency key. Live HMIS and FHIR integration is not implemented.',
  },
];

export function Capabilities() {
  return (
    <section id="capabilities" className="landing-section" aria-labelledby="capabilities-title">
      <div className="landing-wrap">
        <p className="landing-kicker">Capabilities</p>
        <h2 className="landing-title" id="capabilities-title">
          What the prototype actually does.
        </h2>
        <p className="landing-lead">
          Queue visibility, appointment proposals, and decision records share one workflow. A clinician
          authorises anything that changes care operations.
        </p>
        <div className="glass-grid">
          {CAPABILITIES.map((item, index) => (
            <article key={item.title} className="glass-card" tabIndex={0}>
              <span className="glass-index">{String(index + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <p className="glass-detail">{item.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
