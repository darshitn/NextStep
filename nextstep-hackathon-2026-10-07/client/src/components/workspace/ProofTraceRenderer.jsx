import React from 'react';

export default function ProofTraceRenderer({ rendererType, stateSnapshot }) {
  if (!stateSnapshot) return null;

  const {
    array,
    pointers = {},
    activeRange = null,
    highlightedIndices = [],
    setItems = [],
    mapEntries = [],
    stackOrQueue = [],
    callStack = [],
    dpTable = [],
    treeNodes = [],
    graphNodes = [],
    annotation
  } = stateSnapshot;

  // Map array indices to pointer names that point to that index
  const indexPointers = new Map();
  const scalarPointers = [];

  for (const [name, val] of Object.entries(pointers)) {
    if (
      Array.isArray(array) &&
      typeof val === 'number' &&
      Number.isInteger(val) &&
      val >= 0 &&
      val <= array.length &&
      (name === 'i' ||
        name === 'j' ||
        name === 'lo' ||
        name === 'mid' ||
        name === 'hi' ||
        name === 'left' ||
        name === 'right' ||
        name === 'read' ||
        name === 'write' ||
        name === 'minIdx' ||
        name === 'slow' ||
        name === 'fast')
    ) {
      if (!indexPointers.has(val)) indexPointers.set(val, []);
      indexPointers.get(val).push(name);
    } else {
      scalarPointers.push({ name, val });
    }
  }

  return (
    <div
      className="rounded-xl border ui-border-border ui-bg-surface p-4 space-y-4"
      aria-label={`Interactive ${rendererType.replace(/_/g, ' ')} state diagram`}
    >
      {/* Top Annotation */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-bold uppercase tracking-wider ui-text-accent">
          Live State Snapshot · {rendererType.replace(/_/g, ' ')}
        </span>
        {activeRange && (
          <span className="status-badge status-neutral text-xs font-mono">
            Active range: [{activeRange[0]}..{activeRange[1]}]
          </span>
        )}
      </div>

      {annotation && (
        <p className="text-sm font-medium ui-text-ink ui-bg-soft p-3 rounded-lg border ui-border-border">
          {annotation}
        </p>
      )}

      {/* Scalar state variables */}
      {scalarPointers.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap" aria-label="Tracked scalar variables">
          {scalarPointers.map(({ name, val }) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ui-border-border ui-bg-soft text-xs font-mono ui-text-ink"
            >
              <strong className="ui-text-muted">{name}:</strong>
              <span>{String(val)}</span>
            </span>
          ))}
        </div>
      )}

      {/* Array / Binary Search / Sliding Window / Two Pointers Cells */}
      {Array.isArray(array) && array.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold ui-text-muted">
            Index &amp; Value Cells
          </div>
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(64px, 1fr))'
            }}
            role="list"
            aria-label="Array cells"
          >
            {array.map((val, idx) => {
              const isHighlighted = highlightedIndices.includes(idx);
              const inRange =
                activeRange && idx >= activeRange[0] && idx <= activeRange[1];
              const ptrs = indexPointers.get(idx) || [];

              return (
                <div
                  key={idx}
                  role="listitem"
                  className={`rounded-lg border p-2 flex flex-col items-center justify-between gap-1 ${
                    isHighlighted
                      ? 'border-2 ui-border-accent ui-bg-soft'
                      : inRange
                      ? 'ui-border-border ui-bg-surface'
                      : 'ui-border-border ui-bg-soft opacity-75'
                  }`}
                >
                  <span className="text-xs font-mono ui-text-muted">[{idx}]</span>
                  <span className="text-base font-bold font-mono ui-text-ink">
                    {String(val)}
                  </span>
                  <div className="min-h-[20px] flex items-center justify-center gap-1 flex-wrap">
                    {ptrs.map((pName) => (
                      <span
                        key={pName}
                        className="status-badge status-accent text-xs font-mono py-0.5 px-1.5"
                      >
                        {pName}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Past-the-end index n slot when hi === array.length */}
            {indexPointers.has(array.length) && (
              <div
                role="listitem"
                className="rounded-lg border border-dashed ui-border-border ui-bg-soft p-2 flex flex-col items-center justify-between gap-1"
              >
                <span className="text-xs font-mono ui-text-muted">[{array.length}]</span>
                <span className="text-xs font-mono ui-text-muted">end</span>
                <div className="min-h-[20px] flex items-center justify-center gap-1 flex-wrap">
                  {indexPointers.get(array.length).map((pName) => (
                    <span
                      key={pName}
                      className="status-badge status-accent text-xs font-mono py-0.5 px-1.5"
                    >
                      {pName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hash Map Entries */}
      {Array.isArray(mapEntries) && (rendererType === 'set_map_lookup' || mapEntries.length > 0) && (
        <div className="space-y-2">
          <div className="text-xs font-semibold ui-text-muted">
            Hash Map State ({mapEntries.length} {mapEntries.length === 1 ? 'entry' : 'entries'})
          </div>
          {mapEntries.length === 0 ? (
            <div className="text-xs font-mono ui-text-muted ui-bg-soft p-2.5 rounded-lg border ui-border-border">
              Map is currently empty: {'{ }'}
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap" role="list" aria-label="Hash map entries">
              {mapEntries.map((entry, idx) => (
                <div
                  key={`${entry.key}-${idx}`}
                  role="listitem"
                  className="px-3 py-1.5 rounded-lg border ui-border-border ui-bg-soft text-xs font-mono ui-text-ink"
                >
                  <span className="font-bold">{entry.key}</span>
                  <span className="ui-text-muted"> &rarr; </span>
                  <span className="ui-text-accent font-bold">{entry.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Set Items */}
      {Array.isArray(setItems) && setItems.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold ui-text-muted">Hash Set Members</div>
          <div className="flex items-center gap-2 flex-wrap">
            {setItems.map((item, idx) => (
              <span
                key={`${item}-${idx}`}
                className="px-2.5 py-1 rounded-lg border ui-border-border ui-bg-soft text-xs font-mono font-bold ui-text-ink"
              >
                {String(item)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stack / Queue / Call Stack / DP Table / Tree / Graph Nodes */}
      {Array.isArray(stackOrQueue) && stackOrQueue.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs font-semibold ui-text-muted">Stack / Queue Frames</div>
          <div className="flex items-center gap-2 flex-wrap">
            {stackOrQueue.map((frame, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg border ui-border-border ui-bg-soft text-xs font-mono ui-text-ink"
              >
                {String(frame)}
              </span>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(callStack) && callStack.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs font-semibold ui-text-muted">Active Call Stack</div>
          <div className="flex items-center gap-2 flex-wrap">
            {callStack.map((frame, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg border ui-border-border ui-bg-soft text-xs font-mono ui-text-ink"
              >
                {frame}
              </span>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(dpTable) && dpTable.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs font-semibold ui-text-muted">DP State Table</div>
          <div className="flex items-center gap-2 flex-wrap">
            {dpTable.map((cell, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg border ui-border-border ui-bg-soft text-xs font-mono ui-text-ink"
              >
                dp[{idx}] = <strong>{String(cell)}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(treeNodes) && treeNodes.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs font-semibold ui-text-muted">Tree Nodes</div>
          <div className="flex items-center gap-2 flex-wrap">
            {treeNodes.map((n) => (
              <span
                key={n.id}
                className="px-2.5 py-1 rounded-lg border ui-border-border ui-bg-soft text-xs font-mono ui-text-ink"
              >
                {n.label} ({n.state})
              </span>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(graphNodes) && graphNodes.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs font-semibold ui-text-muted">Graph Frontier State</div>
          <div className="flex items-center gap-2 flex-wrap">
            {graphNodes.map((n) => (
              <span
                key={n.id}
                className="px-2.5 py-1 rounded-lg border ui-border-border ui-bg-soft text-xs font-mono ui-text-ink"
              >
                {n.label}: {n.state}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
