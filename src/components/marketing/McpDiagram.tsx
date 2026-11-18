import React from 'react';

const BOX_W = 170;
const BOX_H = 62;

function Box({ x, y, label, hub = false }: { x: number; y: number; label: string; hub?: boolean }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={BOX_W}
        height={BOX_H}
        rx={10}
        fill="#0B2478"
        stroke={hub ? '#FF2400' : '#7D9BB8'}
        strokeWidth={hub ? 3 : 2}
      />
      <text x={x + BOX_W / 2} y={y + BOX_H / 2 + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill="#FFFFFF">
        {label}
      </text>
    </g>
  );
}

function Label({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <g>
      <rect x={x - text.length * 3.6 - 6} y={y - 13} width={text.length * 7.2 + 12} height={18} rx={4} fill="#1034A6" />
      <text x={x} y={y} textAnchor="middle" fontSize={12} fontWeight={600} fill="#FFFFFF">
        {text}
      </text>
    </g>
  );
}

const arrow = 'url(#mz-arrow)';

export function McpDiagram() {
  return (
    <section id="architecture" className="py-24 lg:py-32" style={{ background: 'linear-gradient(to bottom, #1a4f80 0%, #2d6a9f 100%)' }}>
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-stone-light">Architecture</p>
          <h2 className="mt-4 font-heading text-3xl font-extrabold leading-tight text-white md:text-[42px]">
            How systems connect through Mzima.
          </h2>
        </div>

        <div className="mt-14 overflow-x-auto rounded-3xl border border-stone/35 bg-egyptian-deep/60 p-6 lg:p-10">
          <svg viewBox="0 0 760 420" role="img" aria-labelledby="mcp-title mcp-desc" className="mx-auto w-full min-w-[640px] max-w-[760px]">
            <title id="mcp-title">Mzima MCP architecture</title>
            <desc id="mcp-desc">
              Hospital Apps and Intelligent Systems send requests and bounded tool calls to the Mzima MCP Layer. The layer grants
              authorized access to Facility Resources, receives results, and returns auditable responses to both request sources.
            </desc>
            <defs>
              <marker id="mz-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#A9BCD0" />
              </marker>
            </defs>

            <Box x={30} y={60} label="Hospital Apps" />
            <Box x={30} y={298} label="Intelligent Systems" />
            <Box x={295} y={179} label="Mzima MCP Layer" hub />
            <Box x={560} y={179} label="Facility Resources" />

            <line x1={200} y1={91} x2={295} y2={185} stroke="#A9BCD0" strokeWidth={2} markerEnd={arrow} />
            <Label x={238} y={122} text="Requests" />
            <line x1={200} y1={329} x2={295} y2={241} stroke="#A9BCD0" strokeWidth={2} markerEnd={arrow} />
            <Label x={238} y={298} text="Bounded tool calls" />

            <line x1={465} y1={185} x2={560} y2={185} stroke="#A9BCD0" strokeWidth={2} markerEnd={arrow} />
            <Label x={512} y={170} text="Authorized access" />
            <line x1={560} y1={241} x2={465} y2={241} stroke="#A9BCD0" strokeWidth={2} markerEnd={arrow} />
            <Label x={512} y={262} text="Results" />

            <polyline points="330,179 330,26 200,26 200,74" fill="none" stroke="#A9BCD0" strokeWidth={2} strokeDasharray="6 5" markerEnd={arrow} />
            <Label x={264} y={20} text="Auditable responses" />
            <polyline points="330,241 330,394 200,394 200,332" fill="none" stroke="#A9BCD0" strokeWidth={2} strokeDasharray="6 5" markerEnd={arrow} />
            <Label x={264} y={408} text="Auditable responses" />
          </svg>
        </div>

        <p className="mt-8 max-w-2xl text-base leading-relaxed text-white/85">
          Access is controlled. Every action is checked against configured permissions, and consequential actions stay subject to
          human approval where required. The diagram is conceptual.
        </p>
      </div>
    </section>
  );
}
