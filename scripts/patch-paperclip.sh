#!/bin/bash
# Patch OpenClaw hooks.ts to allow empty text in webhook wake
# This enables Paperclip integration without requiring text in the payload

HOOKS_FILE="src/gateway/hooks.ts"

if [ -f "$HOOKS_FILE" ]; then
  echo "Patching $HOOKS_FILE for Paperclip integration..."
  
  # Replace the normalizeWakePayload function to allow empty text
  # Original: returns error "text required"
  # Patched: uses default "wake from webhook"
  sed -i 's/if (!text) {/\/\/ Patched: allow empty text for Paperclip\n  const finalText = text || "wake from webhook";\n  if (false) {/' "$HOOKS_FILE"
  
  # Update the return to use finalText
  sed -i 's/return { ok: true, value: { text, mode } };/return { ok: true, value: { text: finalText, mode } };/' "$HOOKS_FILE"
  
  echo "Patch applied successfully!"
else
  echo "ERROR: $HOOKS_FILE not found!"
  exit 1
fi