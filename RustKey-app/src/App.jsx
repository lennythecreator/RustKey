import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const API_BASE = "http://localhost:8000"
function App() {

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [userId, setUserId] = useState("");

  // Helpers to convert between base64url strings and ArrayBuffers for WebAuthn
  function b64urlToUint8(b64url) {
    const base64 = b64url
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(b64url.length / 4) * 4, '=');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function arrayBufferToB64url(buf) {
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function prepareCreationOptions(ccr) {
    // Convert challenge, user.id, and excludeCredentials[].id to ArrayBuffers
    const pk = ccr.publicKey ?? ccr; // some servers nest under publicKey
    return {
      ...pk,
      challenge: b64urlToUint8(pk.challenge),
      user: {
        ...pk.user,
        id: b64urlToUint8(pk.user.id),
      },
      excludeCredentials: (pk.excludeCredentials || []).map((c) => ({
        ...c,
        id: b64urlToUint8(c.id),
      })),
    };
  }

  function credentialToJSON(cred) {
    const resp = cred.response;
    return {
      id: cred.id,
      type: cred.type,
      rawId: arrayBufferToB64url(cred.rawId),
      response: {
        attestationObject: arrayBufferToB64url(resp.attestationObject),
        clientDataJSON: arrayBufferToB64url(resp.clientDataJSON),
      },
      clientExtensionResults: cred.getClientExtensionResults?.() || {},
    };
  }

  async function handleRegister() {
    // 1) Start on backend
    const startRes = await fetch(API_BASE + "/register/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, display_name: displayName }),
    });
    const startData = await startRes.json();
    const { user_id, ccr } = startData;
    setUserId(user_id);

    // 2) Prepare options and create credential
    const publicKey = prepareCreationOptions(ccr);
    const credential = await navigator.credentials.create({ publicKey });

    // 3) Serialize and finish on backend
    const response = credentialToJSON(credential);
    const finishRes = await fetch(API_BASE + "/register/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, response }),
    });
    const finishData = await finishRes.json();
    console.log('registration finish:', finishData);
  }
function handleGet() {
  navigator.credentials.get({
    publicKey: {
      challenge: new Uint8Array([139, 66, 181, 87, 7, 203 /* … */]),
      rpId: "localhost",
      allowCredentials: [
        {
          type: "public-key",
          id: new Int8Array([37, 125, 70, 73, -77, -77, -36, 26, 75, -120, -25, -110, -88, -67, -91, -8]),
        },
      ],
      userVerification: "required",
    },
  })
    .then((val) => console.log('val get: ', val))
}
// keep handleCreate only if needed elsewhere; registration path now uses conversions above
async function handleCreate(val) {
  const cpk = await navigator.credentials.create(val)
  console.log('cpk: ', cpk)
  return cpk
}
return (
  <div className="min-h-screen bg-background text-foreground">
    <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center p-6">
      <input type='text' placeholder='username' value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type='text' value={displayName} placeholder='display name' onChange={(e) => setDisplayName(e.target.value)} />
      <button onClick={handleRegister}>click to create auth</button>
      {/* <button onClick={handleGet}>click to get auth</button> */}
      {/* <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-xl space-y-6 rounded-2xl border bg-card p-8 shadow-sm"
      >
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            RustKey starter
          </p>
          <h1 className="text-3xl font-semibold">
            React, Framer Motion, and shadcn/ui
          </h1>
          <p className="text-sm text-muted-foreground">
            This baseline is ready for layout, motion, and component work. Drop
            in your UI ideas and start shipping.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button>Get started</Button>
          <Button variant="outline">View components</Button>
        </div>
      </motion.div> */}
    </div>
  </div>
)
}
export default App
