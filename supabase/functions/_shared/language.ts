/**
 * Makes AI text answers follow the language the person picked in the app.
 *
 * Import this FIRST in a function. It wraps Deno.serve to read `uiLanguage` from the
 * JSON request body (added by the app's invokeAi helper), and wraps fetch so calls to the
 * AI gateway's chat endpoint get one extra instruction to write prose in that language.
 * Image-generation calls are left untouched so no text gets painted into pictures.
 */
import { AsyncLocalStorage } from "node:async_hooks";

const store = new AsyncLocalStorage<string>();

const INSTRUCTIONS: Record<string, string> = {
  ar: "LANGUAGE: The user reads Egyptian Arabic. Write every human-readable sentence, description, note, explanation, caption, title and tip in natural Egyptian Arabic (Masri) using Western digits. Keep JSON keys, ids, enum/category/type values, slugs, hex codes, URLs, units and brand names exactly as specified in English.",
};

const g = globalThis as unknown as { __hmLangInstalled?: boolean };
if (!g.__hmLangInstalled) {
  g.__hmLangInstalled = true;

  const origServe = Deno.serve.bind(Deno) as (...a: unknown[]) => unknown;
  // deno-lint-ignore no-explicit-any
  (Deno as any).serve = (...args: unknown[]) => {
    const i = args.findIndex((a) => typeof a === "function");
    if (i >= 0) {
      const handler = args[i] as (req: Request, info: unknown) => Response | Promise<Response>;
      args[i] = async (req: Request, info: unknown) => {
        let lang = "en";
        if (req.method === "POST" && (req.headers.get("content-type") || "").includes("json")) {
          try {
            const body = await req.clone().json();
            if (typeof body?.uiLanguage === "string") lang = body.uiLanguage;
          } catch { /* not JSON */ }
        }
        return store.run(lang, () => handler(req, info));
      };
    }
    return origServe(...args);
  };

  const origFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const instruction = INSTRUCTIONS[store.getStore() || "en"];
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (instruction && url.includes("ai.gateway.lovable.dev") && url.includes("/chat/completions") && typeof init?.body === "string") {
      try {
        const body = JSON.parse(init.body);
        const wantsImage = Array.isArray(body.modalities) && body.modalities.includes("image");
        if (!wantsImage && Array.isArray(body.messages)) {
          body.messages = [...body.messages, { role: "system", content: instruction }];
          init = { ...init, body: JSON.stringify(body) };
        }
      } catch { /* leave request as is */ }
    }
    return origFetch(input, init);
  };
}

export {};
