import { getLanguage, isLanguage, type Language } from './languages';

type RepairCheck = { name: string; body: string };
type RepairResult = { name: string; passed: boolean; message?: string };

const WORKER_TIMEOUT_MS = 1800;
const SANDBOX_TIMEOUT_MS = 4500;
const MAX_SOURCE_LENGTH = 50_000;

const workerScript = `
"use strict";

self.addEventListener("message", async ({ data: { token, source, body } }) => {
    const send = self.postMessage.bind(self);
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const CheckError = Error;
    const assert = (condition, message = "The assertion failed.") => {
        if (!condition) throw new CheckError(message);
    };

    // This worker needs no child workers. Block the constructor even for blob URLs.
    for (const name of ["Worker", "SharedWorker"]) {
        if (name in self) {
            Object.defineProperty(self, name, { value: undefined });
        }
    }

    try {
        const complete = {};
        const run = new AsyncFunction(
            "assert",
            '"use strict";\\n' + source +
            '\\n;\\nawait (async () => {\\n' + body + '\\n})();\\nreturn arguments[1];'
        );
        if ((await run(assert, complete)) !== complete) {
            throw new CheckError("The snippet exited before the check ran.");
        }
        send({ kind: "repair-result", token, passed: true });
    } catch (error) {
        const message = typeof error?.message === "string" ? error.message : String(error);
        send({ kind: "repair-result", token, passed: false, message: message.slice(0, 300) });
    }
}, { once: true });
`;

function sandboxDocument(token: string) {
    // The sandbox has an opaque origin. Its blob worker inherits this policy.
    return `<!doctype html>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src 'none'; script-src 'nonce-${token}' 'unsafe-eval'; worker-src blob:; child-src blob:; frame-src 'none'; base-uri 'none'; form-action 'none'">
<script nonce="${token}">
"use strict";
const token = "${token}";
const send = (message) => parent.postMessage({ ...message, token }, "*");

function start(event) {
    if (event.source !== parent || event.data?.kind !== "repair-start" || event.data.token !== token) return;
    if (typeof event.data.source !== "string" || typeof event.data.body !== "string") return;
    removeEventListener("message", start);

    const url = URL.createObjectURL(new Blob([${JSON.stringify(workerScript)}], { type: "text/javascript" }));
    let worker;
    let timer;
    function finish(result) {
        clearTimeout(timer);
        worker?.terminate();
        URL.revokeObjectURL(url);
        send({ ...result, kind: "repair-result" });
    }

    try {
        worker = new Worker(url);
        worker.onmessage = ({ data }) => {
            if (data?.kind !== "repair-result" || data.token !== token || typeof data.passed !== "boolean") return;
            finish({ passed: data.passed, message: typeof data.message === "string" ? data.message : undefined });
        };
        worker.onerror = (error) => {
            error.preventDefault();
            finish({ passed: false, message: "The browser could not run the check." });
        };
        timer = setTimeout(() => finish({
            passed: false, message: "This check timed out. Look for a loop or a promise that never settles."
        }), ${WORKER_TIMEOUT_MS});
        worker.postMessage({ token, source: event.data.source, body: event.data.body });
    } catch {
        finish({ passed: false, message: "The browser could not start an isolated check." });
    }
}

addEventListener("message", start);
send({ kind: "repair-ready" });
<\/script>`;
}

function runCheck(source: string, check: RepairCheck): Promise<RepairResult> {
    return new Promise((resolve) => {
        const token = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
            byte.toString(16).padStart(2, "0")
        ).join("");
        const frame = document.createElement("iframe");
        frame.hidden = true;
        frame.setAttribute("sandbox", "allow-scripts");
        frame.title = "Isolated repair check";
        frame.srcdoc = sandboxDocument(token);

        let started = false;
        function finish(passed: boolean, message?: string) {
            window.clearTimeout(timer);
            window.removeEventListener("message", onMessage);
            frame.remove();
            resolve({ name: check.name, passed, ...(message ? { message } : {}) });
        }

        function onMessage(event: MessageEvent) {
            if (event.source !== frame.contentWindow || event.origin !== "null" || event.data?.token !== token) return;
            if (event.data.kind === "repair-ready" && !started) {
                started = true;
                frame.contentWindow?.postMessage({ kind: "repair-start", token, source, body: check.body }, "*");
            } else if (started && event.data.kind === "repair-result" && typeof event.data.passed === "boolean") {
                const message = typeof event.data.message === "string" ? event.data.message.slice(0, 300) : undefined;
                finish(event.data.passed, message);
            }
        }

        const timer = window.setTimeout(() => finish(false, started
            ? "This check timed out."
            : "The browser could not start the isolated check."
        ), SANDBOX_TIMEOUT_MS);
        window.addEventListener("message", onMessage);
        document.body.append(frame);
    });
}

export async function checkRepair(source: string, language: Language, checks: RepairCheck[]): Promise<RepairResult[]> {
    const failAll = (message: string) => checks.map(({ name }) => ({ name, passed: false, message }));
    if (source.length > MAX_SOURCE_LENGTH) return failAll("This snippet is too long to check.");
    const descriptor = isLanguage(language) ? getLanguage(language) : undefined;
    if (descriptor?.repair?.runtime !== 'javascript') return failAll('Repair checks are unavailable for this language.');

    let executable: string;
    try {
        executable = await descriptor.repair.prepare(source);
    } catch (error) {
        return failAll(error instanceof Error ? error.message : `Could not read this ${descriptor.name} snippet.`);
    }
    return Promise.all(checks.map((check) => runCheck(executable, check)));
}
