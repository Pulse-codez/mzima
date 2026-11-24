const STEPS = [
  {
    no: '01',
    title: 'Register',
    body: 'The front desk registers the visit and issues a queue token. The visit enters the weighted queue.',
  },
  {
    no: '02',
    title: 'Validate',
    body: 'A nurse checks priority against facility rules and reviews warning signs with the observations that support them.',
  },
  {
    no: '03',
    title: 'Decide',
    body: 'A shift lead approves or rejects the proposal. The system does not commit the booking by itself.',
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="landing-section" aria-labelledby="how-title">
      <div className="landing-wrap">
        <p className="landing-kicker">How a visit moves</p>
        <h2 className="landing-title" id="how-title">
          Three steps. One approval gate.
        </h2>
        <div className="step-grid">
          {STEPS.map((step) => (
            <article key={step.no} className="step-card">
              <span className="step-no">{step.no}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
