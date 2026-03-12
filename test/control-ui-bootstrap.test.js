import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const src = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");

function getFunction(name, args) {
  const m = src.match(new RegExp(`function ${name}\\(${args}\\) \\{([\\s\\S]*?)\\n\\}`));
  assert.ok(m, `${name} not found`);
  // eslint-disable-next-line no-new-func
  return new Function("return function " + name + "(" + args + "){" + m[1] + "\n}")();
}

test("buildControlUiBootstrapLocation appends a fragment token and preserves search params", () => {
  const buildControlUiBootstrapLocation = getFunction("buildControlUiBootstrapLocation", "rawUrl, token");
  assert.equal(
    buildControlUiBootstrapLocation("/openclaw?from=setup", "secret-token"),
    "/openclaw?from=setup#token=secret-token",
  );
});

test("server bootstraps Control UI entry requests with a loop-breaker cookie", () => {
  assert.match(src, /CONTROL_UI_BOOTSTRAP_COOKIE = "openclaw_control_ui_bootstrap"/);
  assert.match(src, /app\.get\(\["\/", "\/openclaw", "\/openclaw\/"\]/);
  assert.match(src, /res\.redirect\(302, buildControlUiBootstrapLocation\(req\.originalUrl \|\| req\.url, OPENCLAW_GATEWAY_TOKEN\)\)/);
  assert.match(src, /Set-Cookie/);
});