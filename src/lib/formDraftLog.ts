export type FormDraftPayload = {
  clientDraftId: string;
  intent: string;
  lang: string;
  status?: "draft" | "validation_failed" | "send_failed";
  formErrorCode?: string;
  formErrorMessage?: string;
  formLastAction?: string;
  [key: string]: unknown;
};

export function createFormDraftId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${String(random).replace(/[^a-zA-Z0-9_-]/g, "")}`.slice(0, 120);
}

export async function saveFormDraft(payload: FormDraftPayload) {
  try {
    await fetch("/api/form-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: JSON.stringify(payload).length < 60000,
    });
  } catch {
    // Draft logging must never block the guest.
  }
}
