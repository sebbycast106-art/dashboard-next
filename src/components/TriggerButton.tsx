"use client";

import { useState } from "react";

interface Service {
  id: string;
  name: string;
  needs_input?: boolean;
  [key: string]: any;
}

interface TriggerButtonProps {
  service: Service;
  onTrigger: (serviceId: string, input?: string) => Promise<any>;
}

type ButtonState = "idle" | "loading" | "success" | "error";

export default function TriggerButton({ service, onTrigger }: TriggerButtonProps) {
  const [state, setState] = useState<ButtonState>("idle");
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");

  const needsInput = service.needs_input;

  const handleClick = async () => {
    if (state === "loading") return;
    setState("loading");
    setMessage("");
    try {
      const result = await onTrigger(service.id, needsInput ? input : undefined);
      setState("success");
      setMessage(result?.message || "Triggered!");
      if (needsInput) setInput("");
    } catch (err: any) {
      setState("error");
      setMessage(err.message || "Failed");
    }
    setTimeout(() => {
      setState("idle");
      setMessage("");
    }, 3000);
  };

  const stateStyles: Record<ButtonState, string> = {
    idle: "bg-gradient-to-r from-[#1e293b] to-[#334155] hover:from-[#334155] hover:to-[#475569] border-[#334155] text-white",
    loading: "bg-[#334155] border-[#475569] text-[#94a3b8] cursor-wait",
    success: "bg-[#4ade80]/20 border-[#4ade80]/40 text-[#4ade80]",
    error: "bg-[#ef4444]/20 border-[#ef4444]/40 text-[#ef4444]",
  };

  return (
    <div className="rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-4">
      <h3 className="text-sm font-semibold text-white mb-3">{service.name}</h3>

      {needsInput && (
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter verification code..."
          className="w-full px-3 py-2 mb-3 rounded-lg bg-[#0f172a] border border-[#334155] text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#60a5fa]/50 transition-colors"
        />
      )}

      <button
        onClick={handleClick}
        disabled={state === "loading" || (needsInput && !input.trim())}
        className={`w-full py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${stateStyles[state]}`}
      >
        {state === "loading" ? (
          <span className="inline-flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Running...
          </span>
        ) : state === "success" ? (
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {message || "Done!"}
          </span>
        ) : state === "error" ? (
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {message || "Error"}
          </span>
        ) : (
          `Run ${service.name}`
        )}
      </button>
    </div>
  );
}
