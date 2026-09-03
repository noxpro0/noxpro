// Cloudflare Pages Function - Netlify Functions ile aynı işi yapar.
// Bu dosya /get-prices adresinde otomatik erişilebilir olur.
// API key burada gizli kalır, kullanıcıya asla gönderilmez.

export async function onRequestGet(context) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=15"
  };

  const apiKey = context.env.TWELVE_DATA_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "TWELVE_DATA_KEY ortam değişkeni Cloudflare'de tanımlı değil." }),
      { status: 500, headers }
    );
  }

  // Ücretsiz plan: dakikada sadece 8 kredi, sembol başına 1 kredi.
  const symbols = [
    "XAU/USD", "XAG/USD", "BTC/USD", "ETH/USD",
    "EUR/USD", "GBP/USD", "USD/JPY", "USD/TRY"
  ];

  try {
    const symbolParam = encodeURIComponent(symbols.join(","));
    const url = `https://api.twelvedata.com/price?symbol=${symbolParam}&apikey=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    return new Response(JSON.stringify(data), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
