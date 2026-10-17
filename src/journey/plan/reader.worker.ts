/// <reference lib="webworker" />
/**
 * Runs public/py/floorplan.py in the browser: Pyodide (Python compiled to WebAssembly) with NumPy and OpenCV.
 * The first use downloads about 20 MB (cached by the browser afterwards), so the page warms it up early.
 */
type Req = { type: "warm" } | { type: "read"; id: number; bytes: ArrayBuffer; tap?: [number, number] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ready: Promise<any> | null = null;

function boot(indexURL: string, scriptURL: string) {
  if (!ready) {
    ready = (async () => {
      post({ type: "status", text: "Getting the plan reader ready…" });
      const { loadPyodide } = await import(/* @vite-ignore */ `${indexURL}pyodide.mjs`);
      const py = await loadPyodide({ indexURL });
      post({ type: "status", text: "Loading the drawing tools…" });
      await py.loadPackage(["numpy", "opencv-python"]);
      const code = await (await fetch(scriptURL)).text();
      py.runPython(code);
      post({ type: "ready" });
      return py;
    })();
    ready.catch(() => {
      ready = null;
    });
  }
  return ready;
}

const post = (m: unknown) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(m);

let urls = { index: "", script: "" };
self.onmessage = async (e: MessageEvent<Req & { indexURL?: string; scriptURL?: string }>) => {
  const msg = e.data;
  if (msg.indexURL) urls = { index: msg.indexURL, script: msg.scriptURL ?? urls.script };
  try {
    const py = await boot(urls.index, urls.script);
    if (msg.type !== "read") return;
    const fn = py.globals.get("read_plan_json");
    const bytes = py.toPy(new Uint8Array(msg.bytes));
    const out = fn(bytes, msg.tap?.[0] ?? null, msg.tap?.[1] ?? null);
    bytes.destroy();
    fn.destroy();
    post({ type: "result", id: msg.id, json: out });
  } catch (err) {
    post({ type: "error", id: msg.type === "read" ? msg.id : -1, message: String((err as Error)?.message ?? err) });
  }
};
