import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const config = window.SEO_MVP_CONFIG || {};
const authStatus = document.querySelector("#auth-status");
const serpRunsEl = document.querySelector("#serp-runs");
const seoRunsEl = document.querySelector("#seo-runs");

function setStatus(message, tone = "") {
  authStatus.textContent = message;
  authStatus.className = `status ${tone}`.trim();
}

function openUrl(url) {
  if (!url) {
    alert("URL not configured yet.");
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

document.querySelector("#open-sheet").addEventListener("click", () => openUrl(config.googleSheetUrl));
document.querySelector("#open-repo").addEventListener("click", () => openUrl(config.repoUrl));
document.querySelector("#open-n8n").addEventListener("click", () => openUrl(config.n8nUrl));
document.querySelector("#open-supabase").addEventListener("click", () => openUrl(config.supabaseDashboardUrl));

if (!config.supabaseUrl || !config.supabaseAnonKey) {
  setStatus("Missing web/config.js. Copy config.example.js to config.js and fill in Supabase values.", "error");
  throw new Error("Missing SEO_MVP_CONFIG Supabase values.");
}

const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

async function loadRuns() {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) {
    serpRunsEl.textContent = "Sign in to view runs.";
    seoRunsEl.textContent = "Sign in to view runs.";
    serpRunsEl.className = "list empty";
    seoRunsEl.className = "list empty";
    return;
  }

  const { data: serpRuns, error: serpError } = await supabase
    .from("serp_runs")
    .select("keyword, output_folder, status, mode, result_count, created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: seoRuns, error: seoError } = await supabase
    .from("seo_runs")
    .select("keyword, product, scenario, output_folder, status, mode, created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  renderList(serpRunsEl, serpRuns, serpError, (run) => `
    <div class="item">
      <strong>${run.keyword}</strong>
      <span>${run.status} · ${run.mode} · ${run.result_count} results</span>
      <span>${run.output_folder}</span>
    </div>
  `);
  renderList(seoRunsEl, seoRuns, seoError, (run) => `
    <div class="item">
      <strong>${run.keyword}</strong>
      <span>${run.product || "No product"} · ${run.scenario || "No scenario"}</span>
      <span>${run.status} · ${run.mode} · ${run.output_folder}</span>
    </div>
  `);
}

function renderList(target, rows, error, renderItem) {
  if (error) {
    target.innerHTML = `<div class="error-box">${error.message}</div>`;
    target.className = "list";
    return;
  }
  if (!rows || !rows.length) {
    target.textContent = "No runs yet.";
    target.className = "list empty";
    return;
  }
  target.innerHTML = rows.map(renderItem).join("");
  target.className = "list";
}

async function postWebhook(url, payload) {
  if (!url) {
    return { skipped: true };
  }
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status}`);
  }
  return response.json().catch(() => ({}));
}

async function requireSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    throw new Error("Please sign in first.");
  }
  return data.session;
}

document.querySelector("#auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setStatus("Signed in.");
    await loadRuns();
  } catch (error) {
    setStatus(error.message || String(error), "error");
  }
});

document.querySelector("#sign-up").addEventListener("click", async () => {
  try {
    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    setStatus("Account created. Check your inbox if email confirmation is enabled.");
  } catch (error) {
    setStatus(error.message || String(error), "error");
  }
});

document.querySelector("#sign-out").addEventListener("click", async () => {
  await supabase.auth.signOut();
  setStatus("Signed out.");
  await loadRuns();
});

document.querySelector("#serp-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const session = await requireSession();
    const payload = {
      user_id: session.user.id,
      keyword: document.querySelector("#serp-keyword").value,
      output_folder: document.querySelector("#serp-folder").value || "default",
      status: "pending",
      mode: "mock",
      metadata: { source: "web-dashboard" }
    };
    const { error } = await supabase.from("serp_runs").insert(payload);
    if (error) throw error;
    setStatus("SERP run saved.");
    await loadRuns();
  } catch (error) {
    setStatus(error.message || String(error), "error");
  }
});

document.querySelector("#seo-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const session = await requireSession();
    const payload = {
      user_id: session.user.id,
      keyword: document.querySelector("#seo-keyword").value,
      product: document.querySelector("#seo-product").value,
      scenario: document.querySelector("#seo-scenario").value,
      output_folder: document.querySelector("#seo-folder").value || "default",
      status: "pending",
      mode: "mock",
      metadata: { source: "web-dashboard" }
    };
    const { error } = await supabase.from("seo_runs").insert(payload);
    if (error) throw error;
    setStatus("SEO run saved.");
    await loadRuns();
  } catch (error) {
    setStatus(error.message || String(error), "error");
  }
});

document.querySelector("#trigger-serp-webhook").addEventListener("click", async () => {
  try {
    const payload = {
      keyword: document.querySelector("#serp-keyword").value,
      output_folder: document.querySelector("#serp-folder").value || "default"
    };
    await postWebhook(config.serpWebhookUrl, payload);
    setStatus("SERP webhook triggered.");
  } catch (error) {
    setStatus(error.message || String(error), "error");
  }
});

document.querySelector("#trigger-seo-webhook").addEventListener("click", async () => {
  try {
    const payload = {
      keyword: document.querySelector("#seo-keyword").value,
      product: document.querySelector("#seo-product").value,
      scenario: document.querySelector("#seo-scenario").value,
      output_folder: document.querySelector("#seo-folder").value || "default"
    };
    await postWebhook(config.seoWebhookUrl, payload);
    setStatus("SEO webhook triggered.");
  } catch (error) {
    setStatus(error.message || String(error), "error");
  }
});

supabase.auth.onAuthStateChange(async (_event, session) => {
  if (session) {
    setStatus(`Signed in as ${session.user.email}`);
  } else {
    setStatus("Not signed in.");
  }
  await loadRuns();
});

loadRuns().catch((error) => setStatus(error.message || String(error), "error"));
