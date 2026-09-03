// Cloudflare Pages Function - Netlify Functions ile aynı işi yapar.
// Bu dosya /data adresinde otomatik erişilebilir olur.
// Journal / Kasa Defteri / Backtest verilerini Firebase Realtime Database'de
// bulutta saklar. Basit bir PIN kontrolü var - sadece sen (PIN'i bilen)
// okuyup yazabilirsin.

export async function onRequest(context) {
  const { request, env } = context;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, x-nox-pin",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  };

  if (request.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  const PIN = env.NOX_PIN;
  let DB_URL = env.FIREBASE_DB_URL;

  if (!PIN || !DB_URL) {
    return new Response(
      JSON.stringify({ error: "Sunucu ortam değişkenleri eksik: NOX_PIN / FIREBASE_DB_URL Cloudflare'de tanımlı değil." }),
      { status: 500, headers }
    );
  }

  DB_URL = DB_URL.replace(/\/+$/, "");

  const url = new URL(request.url);
  const providedPin = request.headers.get("x-nox-pin") || url.searchParams.get("pin");
  if (providedPin !== PIN) {
    return new Response(JSON.stringify({ error: "Geçersiz PIN." }), { status: 401, headers });
  }

  const recordUrl = `${DB_URL}/noxdata.json`;

  try {
    if (request.method === "GET") {
      const res = await fetch(recordUrl);
      if (!res.ok) throw new Error("Firebase okuma hatası: " + res.status);
      const data = await res.json();
      return new Response(JSON.stringify(data || {}), { status: 200, headers });
    }

    if (request.method === "POST") {
      const body = await request.text();
      const res = await fetch(recordUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body
      });
      if (!res.ok) throw new Error("Firebase yazma hatası: " + res.status);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: "Desteklenmeyen metod." }), { status: 405, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
