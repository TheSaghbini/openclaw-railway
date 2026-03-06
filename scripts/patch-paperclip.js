// Patch OpenClaw hooks.ts to allow empty text in webhook wake
// This enables Paperclip integration without requiring text in the payload
const fs = require('fs');
const path = require('path');

const hooksFile = path.join(__dirname, '..', 'src', 'gateway', 'hooks.ts');

try {
  let content = fs.readFileSync(hooksFile, 'utf8');
  
  // Find and replace the normalizeWakePayload function's text validation
  const oldCode = `const text = typeof payload.text === "string" ? payload.text.trim() : "";
  if (!text) {
    return { ok: false, error: "text required" };
  }
  const mode = payload.mode === "next-heartbeat" ? "next-heartbeat" : "now";
  return { ok: true, value: { text, mode } };`;
  
  const newCode = `const text = typeof payload.text === "string" ? payload.text.trim() : "";
  // Allow empty text - use default for integrations like Paperclip
  const finalText = text || "wake from webhook";
  const mode = payload.mode === "next-heartbeat" ? "next-heartbeat" : "now";
  return { ok: true, value: { text: finalText, mode } };`;
  
  if (content.includes('return { ok: false, error: "text required" }')) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(hooksFile, content, 'utf8');
    console.log('✅ Patched hooks.ts for Paperclip integration');
  } else {
    console.log('⚠️ hooks.ts already patched or pattern not found');
  }
} catch (err) {
  console.error('❌ Failed to patch:', err.message);
  process.exit(1);
}