import { useState } from 'react'

const API_BASE = "http://localhost:8000"
function App() {

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [userId, setUserId] = useState("");

  const toBuf = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), c => c.charCodeAt(0));
  const toB64url = (buf) => {
    const bin = String.fromCharCode(...new Uint8Array(buf));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  };

  async function handleRegister() {
    const startRes = await fetch(API_BASE + "/register/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, display_name: displayName }),
    });
    const startData = await startRes.json();
    const { user_id, ccr } = startData;
    setUserId(user_id);
    const pkCreate = ccr.publicKey ?? ccr;
    const publicKey = {
      ...pkCreate,
      challenge: toBuf(pkCreate.challenge),
      user: { ...pkCreate.user, id: toBuf(pkCreate.user.id) },
      excludeCredentials: (pkCreate.excludeCredentials || []).map(c => ({ ...c, id: toBuf(c.id) })),
    };
    const credential = await navigator.credentials.create({ publicKey });
    const respCreate = credential.response;
    const response = {
      id: credential.id,
      type: credential.type,
      rawId: toB64url(credential.rawId),
      response: {
        attestationObject: toB64url(respCreate.attestationObject),
        clientDataJSON: toB64url(respCreate.clientDataJSON),
      },
      clientExtensionResults: credential.getClientExtensionResults?.() || {},
    };
    const finishRes = await fetch(API_BASE + "/register/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, response }),
    });
    const finishData = await finishRes.json();
    console.log('registration finish:', finishData);
  }
async function handleAuth() {
  if (!userId) return;
  const startRes = await fetch(API_BASE + "/auth/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  const startData = await startRes.json();
  const { rcr } = startData;
  const pkGet = rcr.publicKey ?? rcr;
  const publicKey = {
    ...pkGet,
    challenge: toBuf(pkGet.challenge),
    allowCredentials: (pkGet.allowCredentials || []).map(c => ({ ...c, id: toBuf(c.id) })),
  };
  const assertion = await navigator.credentials.get({ publicKey });
  const respGet = assertion.response;
  const response = {
    id: assertion.id,
    type: assertion.type,
    rawId: toB64url(assertion.rawId),
    response: {
      authenticatorData: toB64url(respGet.authenticatorData),
      clientDataJSON: toB64url(respGet.clientDataJSON),
      signature: toB64url(respGet.signature),
      userHandle: respGet.userHandle ? toB64url(respGet.userHandle) : null,
    },
    clientExtensionResults: assertion.getClientExtensionResults?.() || {},
  };
  const finishRes = await fetch(API_BASE + "/auth/finish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, auth: response }),
  });
  const finishData = await finishRes.json();
  console.log('authentication finish:', finishData);
}
return (
<div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <h2 className="mb-1 text-xl font-semibold text-slate-900">Create account</h2>
  <p className="mb-6 text-sm text-slate-600">Enter a username and display name.</p>

  <div className="space-y-4">
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        Username
      </label>
      <input
        type="text"
        placeholder="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"
      />
    </div>

    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        Display name
      </label>
      <input
        type="text"
        placeholder="display name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"
      />
    </div>

    <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
      <button
        onClick={handleRegister}
        className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Create auth
      </button>

      <button
        onClick={handleAuth}
        className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-slate-400/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Get auth
      </button>
    </div>
  </div>
</div>
  
)
}
export default App
