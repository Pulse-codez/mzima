import { useEffect, useRef, useState } from 'react';
import credits from '../../data/photo-credits.json';

const clinicPhoto = credits.find((photo) => photo.key === 'clinic-reception')!;

const STATS = [
  { target: 4, label: 'Ordering rules for the live queue' },
  { target: 120, label: 'Minute wait cap, applied before score' },
  { target: 1, label: 'Named clinician before any booking' },
];

function useCount(target: number, active: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setValue(target);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 700);
      setValue(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target]);

  return value;
}

function Stat({ target, label, active }: { target: number; label: string; active: boolean }) {
  const value = useCount(target, active);
  return (
    <p>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </p>
  );
}

export function Idea() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActive(true);
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="workflow" className="landing-section idea" ref={ref} aria-labelledby="workflow-title">
      <div className="landing-wrap">
        <p className="landing-kicker">The operational picture</p>
        <p className="idea-statement" id="workflow-title">
          Queues, slots, and schedules stay fragmented until they share <em>one view</em>.
        </p>
        <p className="landing-lead">
          Mzima is a synthetic-data prototype for outpatient queues, appointment coordination, and clinic
          scheduling in Level 6 public hospitals in Kenya. It does not diagnose, and it does not change a
          booking on its own.
        </p>
        <div className="care-showcase">
          <figure className="clinic-photo">
            <img
              src={clinicPhoto.src}
              alt="An unoccupied hospital reception counter"
              width={1600}
              height={1067}
              loading="lazy"
              decoding="async"
            />
            <figcaption>
              <span>Outpatient care setting</span>
              <a href={clinicPhoto.photoPage} target="_blank" rel="noreferrer">Photo via Unsplash</a>
            </figcaption>
          </figure>
          <aside className="queue-board" aria-label="Illustrative synthetic queue snapshot">
            <div className="queue-board-head">
              <div>
                <p className="queue-eyebrow">Queue snapshot / synthetic</p>
                <h3>Outpatient queue</h3>
              </div>
              <span className="queue-total"><b>08</b> waiting</span>
            </div>
            <div className="queue-rows">
              <div className="queue-row">
                <span className="queue-token">014</span>
                <span className="queue-copy"><b>Triage complete</b><small>Ready for review</small></span>
                <span className="queue-time">04 min</span>
              </div>
              <div className="queue-row queue-row-current">
                <span className="queue-token">015</span>
                <span className="queue-copy"><b>Nurse validation</b><small>Review in progress</small></span>
                <span className="queue-pulse" aria-label="In progress" />
              </div>
              <div className="queue-row">
                <span className="queue-token">016</span>
                <span className="queue-copy"><b>Waiting</b><small>Arrived recently</small></span>
                <span className="queue-time">11 min</span>
              </div>
            </div>
            <p className="queue-board-foot"><span aria-hidden="true" /> Staff review stays in control</p>
          </aside>
        </div>
        <div className="stat-grid">
          {STATS.map((stat) => (
            <Stat key={stat.label} {...stat} active={active} />
          ))}
          <p>
            <span className="stat-value">Synthetic</span>
            <span className="stat-label">Data only. Not for live care.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
