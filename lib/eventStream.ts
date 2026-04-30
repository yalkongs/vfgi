export type FGIEvent =
  | { type: "section"; key: string; title: string; round: number }
  | { type: "moderator"; text: string; intent?: "intro" | "probe" | "wrap" }
  | { type: "speak"; personaId: string; text: string; sentiment?: number; confidence?: number }
  | { type: "crosstalk"; fromId: string; toId: string; stance: "agree" | "disagree"; text: string }
  | { type: "insight"; segment: string; theme: string; quote?: string; strength: number }
  | { type: "metric"; key: string; value: number; perSegment?: Record<string, number> }
  | { type: "verdict"; acceptance: number; recommend: string; drivers: string[]; barriers: string[] }
  | { type: "error"; text: string; code?: string }
  | { type: "end"; stats: { speaks: number; durationMs: number; tokens: number } };

export type SeqEvent = FGIEvent & { seq: number };

export function encodeSSE(ev: SeqEvent) {
  return `id: ${ev.seq}\nevent: ${ev.type}\ndata: ${JSON.stringify(ev)}\n\n`;
}

export class EventEmitter {
  private seq = 0;
  private encoder = new TextEncoder();
  constructor(private controller: ReadableStreamDefaultController<Uint8Array>) {}

  emit(ev: FGIEvent): SeqEvent {
    const seqEv: SeqEvent = { ...ev, seq: ++this.seq };
    this.controller.enqueue(this.encoder.encode(encodeSSE(seqEv)));
    return seqEv;
  }

  close() {
    try {
      this.controller.close();
    } catch {}
  }
}

export function makeStream(): {
  stream: ReadableStream<Uint8Array>;
  start: (run: (e: EventEmitter) => Promise<void>) => void;
} {
  let started = false;
  let runFn: ((e: EventEmitter) => Promise<void>) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const emitter = new EventEmitter(controller);
      const exec = async () => {
        try {
          if (runFn) await runFn(emitter);
        } catch (e) {
          emitter.emit({
            type: "error",
            text: (e as Error).message ?? String(e),
          });
        } finally {
          emitter.close();
        }
      };
      if (started) void exec();
      else {
        const i = setInterval(() => {
          if (started) {
            clearInterval(i);
            void exec();
          }
        }, 5);
      }
    },
  });

  return {
    stream,
    start(fn) {
      runFn = fn;
      started = true;
    },
  };
}
