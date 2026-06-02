import { logger } from "./logger";

export interface ExportEmailPayload {
  to: string[];
  venueName: string;
  ownerName: string;
  ownerEmail: string;
  exportType: string;
  fileName: string;
  csvContent: string;
  periodLabel: string;
  recordCount: number;
}

const EXPORT_TYPE_LABELS: Record<string, string> = {
  "waste": "Waste Log",
  "food-cost": "Food Cost Analysis",
  "stocktake": "Stocktake",
  "inventory": "Inventory Snapshot",
  "temperature": "Temperature Checks",
  "suppliers": "Supplier Price History",
};

function labelFor(type: string): string {
  return EXPORT_TYPE_LABELS[type] ?? type;
}

/** Polished branded HTML email for a single recipient */
function buildHtml(payload: ExportEmailPayload): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#2563eb;padding:28px 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.7);">Kitchen Command</p>
                    <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.2;">Data Export Ready</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Venue banner -->
          <tr>
            <td style="background:#1d4ed8;padding:10px 32px;">
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.85);">
                <strong style="color:#ffffff;">${payload.venueName}</strong>
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                Your export has been generated and is attached to this email as a CSV file.
              </p>

              <!-- Detail table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
                <tr style="border-bottom:1px solid #e5e7eb;">
                  <td style="padding:12px 16px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;width:40%;">Export Type</td>
                  <td style="padding:12px 16px;font-size:14px;color:#111827;font-weight:600;">${labelFor(payload.exportType)}</td>
                </tr>
                <tr style="border-bottom:1px solid #e5e7eb;background:#ffffff;">
                  <td style="padding:12px 16px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Period</td>
                  <td style="padding:12px 16px;font-size:14px;color:#111827;">${payload.periodLabel}</td>
                </tr>
                <tr style="border-bottom:1px solid #e5e7eb;">
                  <td style="padding:12px 16px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Records</td>
                  <td style="padding:12px 16px;font-size:14px;color:#111827;">${payload.recordCount.toLocaleString()}</td>
                </tr>
                <tr style="background:#ffffff;">
                  <td style="padding:12px 16px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">File</td>
                  <td style="padding:12px 16px;font-size:14px;color:#111827;font-family:monospace;">${payload.fileName}</td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
                Open the attached CSV in Excel, Google Sheets, or any spreadsheet application for analysis.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"></td></tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;">
              <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;line-height:1.6;">
                <strong style="color:#6b7280;">Please do not reply to this email.</strong>
                This is an automated notification sent by Kitchen Command.
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                For questions about this export, contact
                <strong style="color:#6b7280;">${payload.ownerName}</strong>
                at <a href="mailto:${payload.ownerEmail}" style="color:#2563eb;text-decoration:none;">${payload.ownerEmail}</a>.
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#d1d5db;">
                Kitchen Command &mdash; Operational intelligence for professional kitchens.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendViaResend(payload: ExportEmailPayload, apiKey: string): Promise<void> {
  const csvBase64 = Buffer.from(payload.csvContent, "utf-8").toString("base64");
  const fromAddress = process.env["RESEND_FROM_EMAIL"] ?? "onboarding@resend.dev";
  const from = `Kitchen Command <${fromAddress}>`;
  const subject = `${payload.venueName} — ${labelFor(payload.exportType)} Export`;
  const html = buildHtml(payload);
  const attachment = { filename: payload.fileName, content: csvBase64 };

  if (payload.to.length === 1) {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [payload.to[0]], subject, html, attachments: [attachment] }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Resend API error ${resp.status}: ${text}`);
    }
    return;
  }

  // Multiple recipients — batch so each gets an individual copy
  const batch = payload.to.map(address => ({
    from,
    to: [address],
    subject,
    html,
    attachments: [attachment],
  }));

  const resp = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(batch),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Resend batch API error ${resp.status}: ${text}`);
  }

  try {
    const json = await resp.json() as { data?: Array<{ id?: string; error?: string }> };
    const failed = json.data?.filter(d => d.error) ?? [];
    if (failed.length > 0) {
      logger.warn({ failed }, "Some batch recipients failed in Resend");
    }
  } catch { /* non-fatal */ }
}

export async function sendExportEmail(payload: ExportEmailPayload): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    logger.info({ to: payload.to, fileName: payload.fileName }, "Email skipped — RESEND_API_KEY not configured");
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }
  if (payload.to.length === 0) {
    return { sent: false, error: "No recipients" };
  }
  try {
    await sendViaResend(payload, apiKey);
    logger.info({ to: payload.to, recipientCount: payload.to.length, fileName: payload.fileName }, "Export email(s) sent");
    return { sent: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err, to: payload.to }, "Failed to send export email");
    return { sent: false, error: msg };
  }
}

export function isEmailConfigured(): boolean {
  return !!process.env["RESEND_API_KEY"];
}
