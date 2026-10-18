import { useRef, useState } from "react";

type Kind = "stack" | "queue" | "deque";
type Item = { id: number; v: number };

/** Push and pop from each end allowed by the ADT and watch the order. */
export default function StackQueue() {
  const [kind, setKind] = useState<Kind>("stack");
  const [items, setItems] = useState<Item[]>([
    { id: 1, v: 4 },
    { id: 2, v: 9 },
    { id: 3, v: 2 },
  ]);
  const [log, setLog] = useState<string[]>([]);
  const nextId = useRef(4);

  const val = () => 1 + Math.floor(Math.random() * 20);
  const note = (s: string) => setLog((l) => [s, ...l].slice(0, 5));

  const addBack = () => {
    if (items.length >= 8) return;
    const it = { id: nextId.current++, v: val() };
    setItems([...items, it]);
    note(kind === "stack" ? `push(${it.v})` : kind === "queue" ? `enqueue(${it.v})` : `addLast(${it.v})`);
  };
  const addFront = () => {
    if (items.length >= 8) return;
    const it = { id: nextId.current++, v: val() };
    setItems([it, ...items]);
    note(`addFirst(${it.v})`);
  };
  const removeBack = () => {
    if (!items.length) return note("empty → null");
    const last = items[items.length - 1];
    setItems(items.slice(0, -1));
    note(kind === "stack" ? `pop() → ${last.v}` : `removeLast() → ${last.v}`);
  };
  const removeFront = () => {
    if (!items.length) return note("empty → null");
    setItems(items.slice(1));
    note(kind === "queue" ? `dequeue() → ${items[0].v}` : `removeFirst() → ${items[0].v}`);
  };

  return (
    <div className="viz viz-sq">
      <div className="viz-row viz-chips">
        {(["stack", "queue", "deque"] as Kind[]).map((k) => (
          <button key={k} className={`chip ${k === kind ? "is-on" : ""}`} aria-pressed={k === kind} onClick={() => setKind(k)}>
            {k[0].toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>

      <div className={`sq-track sq-${kind}`}>
        <span className="sq-end sq-front">{kind === "stack" ? "bottom" : "front"}</span>
        <div className="sq-items">
          {items.map((it, i) => (
            <div key={it.id} className={`sq-item ${i === items.length - 1 && kind === "stack" ? "is-top" : ""} ${i === 0 && kind === "queue" ? "is-top" : ""}`}>
              {it.v}
            </div>
          ))}
        </div>
        <span className="sq-end sq-back">{kind === "stack" ? "top" : "back"}</span>
      </div>

      <div className="sq-actions">
        {kind === "stack" && (
          <>
            <button className="btn" onClick={addBack}>push</button>
            <button className="btn btn-soft" onClick={removeBack}>pop</button>
          </>
        )}
        {kind === "queue" && (
          <>
            <button className="btn" onClick={addBack}>enqueue</button>
            <button className="btn btn-soft" onClick={removeFront}>dequeue</button>
          </>
        )}
        {kind === "deque" && (
          <>
            <button className="btn" onClick={addFront}>addFirst</button>
            <button className="btn" onClick={addBack}>addLast</button>
            <button className="btn btn-soft" onClick={removeFront}>removeFirst</button>
            <button className="btn btn-soft" onClick={removeBack}>removeLast</button>
          </>
        )}
      </div>

      <ol className="sq-log" aria-live="polite">
        {log.map((l, i) => <li key={`${l}-${i}`}>{l}</li>)}
      </ol>
      <p className="viz-readout">
        {kind === "stack" ? "LIFO: the last item in is the first out." : kind === "queue" ? "FIFO: items leave in the order they arrived." : "A deque allows O(1) inserts and removals at both ends."}
      </p>
    </div>
  );
}
