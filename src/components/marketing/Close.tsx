export function Close() {
  return (
    <section className="landing-section close" aria-labelledby="close-title">
      <div className="landing-wrap">
        <p className="landing-kicker">Open the prototype</p>
        <h2 className="landing-title" id="close-title">
          Sign in and work a synthetic visit.
        </h2>
        <p className="close-copy">
          Use the role you are testing. Every clinical change still waits for a named clinician, and the data
          on this prototype is synthetic.
        </p>
        <div className="close-actions">
          <a className="landing-button" href="/login">
            Sign in
          </a>
          <a className="landing-button landing-button-ghost" href="#how">
            See how it works
          </a>
        </div>
        <div className="landing-foot">
          <p>Mzima. Outpatient queues, appointments, and clinic scheduling.</p>
          <p>Level 6 public hospitals in Kenya. Synthetic data only.</p>
        </div>
      </div>
    </section>
  );
}
