import { useEffect, useRef, useState } from "react";

/**
 * Generator PRO is a Svelte custom element. Its config attribute points to a
 * fetchable JSON manifest; assets is the base URL for WebP layer files.
 * This component never pretends a static background is a composited scene.
 */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "showroom-configurator": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        config?: string;
        assets?: string;
        themecolor?: string;
        showlogo?: string;
        showpoweredby?: string;
      };
    }
  }
}

type Props = { configUrl: string; assetsUrl: string; scriptUrl: string; };
let loadedScript: Promise<void> | null = null;

function ensureGeneratorScript(url: string): Promise<void> {
  if (customElements.get("showroom-configurator")) return Promise.resolve();
  if (!loadedScript) {
    loadedScript = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.type = 'module';
      script.onload = () => customElements.get("showroom-configurator") ? resolve() : reject(new Error("Generator bundle did not register showroom-configurator"));
      script.onerror = () => reject(new Error("Generator PRO bundle could not be loaded"));
      document.head.appendChild(script);
    }).catch(error => {
      loadedScript = null;
      throw error;
    });
  }
  return loadedScript;
}

export function GeneratorProShowroom({ configUrl, assetsUrl, scriptUrl }: Props) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    setStatus("loading");
    ensureGeneratorScript(scriptUrl).then(() => {
      if (mounted.current) setStatus("ready");
    }).catch((error: Error) => {
      if (mounted.current) {
        setMessage(error.message);
        setStatus("error");
      }
    });
    return () => { mounted.current = false; };
  }, [scriptUrl]);
  if (status === "error") return <div role="alert" className="panel" style={{ padding: 24 }}>
    <p className="p">Interactive showroom unavailable: {message}</p>
  </div>;
  if (status !== "ready") return <div role="status" className="panel" style={{ padding: 24 }}>Loading interactive showroom…</div>;
  return <showroom-configurator key={configUrl} config={configUrl} assets={assetsUrl}
    themecolor="#AB92C8" showlogo="false" showpoweredby="false" />;
}
