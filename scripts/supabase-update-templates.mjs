// Supabase Email Templates updater (OTP-only)
// Usage (PowerShell):
//   $env:SUPABASE_ACCESS_TOKEN="<personal_access_token>"; $env:SUPABASE_PROJECT_REF="<project-ref>"; pnpm supabase:templates:dry
//   $env:SUPABASE_ACCESS_TOKEN="<personal_access_token>"; $env:SUPABASE_PROJECT_REF="<project-ref>"; pnpm supabase:templates:apply
// Notes:
// - This script fetches current auth config and prints keys so you can verify the template field names.
// - Apply mode sends a PATCH with an OTP-focused set of email templates that show {{ .Token }} (no magic links).
// - Requires: Node 18+ (global fetch available).

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF; // e.g. abcd1234
const APPLY = process.argv.includes("--apply");

if (!ACCESS_TOKEN || !PROJECT_REF) {
  console.error(
    "Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF env vars."
  );
  process.exit(1);
}

const endpoint = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;

const TEMPLATES = {
  // You can freely customize copy/branding below.
  confirm_signup: {
    subject: "Your verification code",
    content: `<!doctype html><html><body>
      <h2>Verify your email</h2>
      <p>Use this code to finish signing up:</p>
      <p style="font-size:20px;font-weight:bold">{{ .Token }}</p>
      <p>This code expires soon. If you didn't request it, you can ignore this email.</p>
    </body></html>`,
  },
  magic_link: {
    subject: "Your one-time code",
    content: `<!doctype html><html><body>
      <h2>One-time sign-in code</h2>
      <p>Enter this code in the app to sign in:</p>
      <p style="font-size:20px;font-weight:bold">{{ .Token }}</p>
    </body></html>`,
  },
  recovery: {
    subject: "Reset password code",
    content: `<!doctype html><html><body>
      <h2>Reset your password</h2>
      <p>Enter this code on the reset screen:</p>
      <p style="font-size:20px;font-weight:bold">{{ .Token }}</p>
      <p>If you didn't ask to reset your password, you can ignore this email.</p>
    </body></html>`,
  },
  invite: {
    subject: "You're invited",
    content: `<!doctype html><html><body>
      <h2>You're invited</h2>
      <p>Use this code to accept the invitation:</p>
      <p style="font-size:20px;font-weight:bold">{{ .Token }}</p>
    </body></html>`,
  },
  email_change: {
    subject: "Confirm your new email",
    content: `<!doctype html><html><body>
      <h2>Confirm your new email</h2>
      <p>Enter this code to confirm change:</p>
      <p style="font-size:20px;font-weight:bold">{{ .Token }}</p>
    </body></html>`,
  },
  reauthentication: {
    subject: "Re-authentication code",
    content: `<!doctype html><html><body>
      <h2>Security check</h2>
      <p>Enter this code to continue:</p>
      <p style="font-size:20px;font-weight:bold">{{ .Token }}</p>
    </body></html>`,
  },
};

function buildPatchPayload(remote) {
  // Prefer the shape used by your project. We try to mirror any existing structure.
  // Many projects expose: { mailer_templates: { confirm_signup: {subject, content}, ... } }
  // If your response uses different keys, edit below to match.
  const payload = {};
  if (remote && typeof remote.mailer_templates === "object") {
    payload.mailer_templates = {
      ...remote.mailer_templates,
      confirm_signup: {
        ...(remote.mailer_templates.confirm_signup || {}),
        ...TEMPLATES.confirm_signup,
      },
      magic_link: {
        ...(remote.mailer_templates.magic_link || {}),
        ...TEMPLATES.magic_link,
      },
      recovery: {
        ...(remote.mailer_templates.recovery || {}),
        ...TEMPLATES.recovery,
      },
      invite: {
        ...(remote.mailer_templates.invite || {}),
        ...TEMPLATES.invite,
      },
      email_change: {
        ...(remote.mailer_templates.email_change || {}),
        ...TEMPLATES.email_change,
      },
      reauthentication: {
        ...(remote.mailer_templates.reauthentication || {}),
        ...TEMPLATES.reauthentication,
      },
    };
  } else {
    // Fallback: send just mailer_templates block.
    payload.mailer_templates = {
      confirm_signup: TEMPLATES.confirm_signup,
      magic_link: TEMPLATES.magic_link,
      recovery: TEMPLATES.recovery,
      invite: TEMPLATES.invite,
      email_change: TEMPLATES.email_change,
      reauthentication: TEMPLATES.reauthentication,
    };
  }
  return payload;
}

async function main() {
  console.log(`Reading current auth config for project ${PROJECT_REF} ...`);
  const res = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    console.error("GET auth config failed:", res.status, await res.text());
    process.exit(1);
  }
  const current = await res.json();
  const keys = Object.keys(current || {});
  console.log("Top-level keys:", keys);
  if (current?.mailer_templates) {
    console.log(
      "mailer_templates keys:",
      Object.keys(current.mailer_templates)
    );
  } else {
    console.warn(
      "No mailer_templates key found in response. You'll need to adapt payload fields."
    );
  }

  const patchPayload = buildPatchPayload(current);
  console.log(
    "\nPrepared PATCH payload (preview):\n",
    JSON.stringify(patchPayload, null, 2)
  );

  if (!APPLY) {
    console.log(
      "\nDry run complete. Re-run with --apply (or pnpm supabase:templates:apply) to apply changes."
    );
    return;
  }

  console.log("\nApplying template updates (OTP-only)...");
  const patchRes = await fetch(endpoint, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(patchPayload),
  });
  const patchText = await patchRes.text();
  if (!patchRes.ok) {
    console.error("PATCH failed:", patchRes.status, patchText);
    process.exit(1);
  }
  console.log("PATCH result:", patchText);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
