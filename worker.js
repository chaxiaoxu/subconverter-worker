export default {
  async fetch(request) {
    const url = new URL(request.url)

    // =========================
    // 你的真实订阅
    // =========================
    const SUB_URL =
      "https://pages-879.pages.dev/386bab19-4a72-4fe2-b5c6-eb98701333a6/sub"

    // =========================
    // 首页 Psub 风格
    // =========================
    if (url.pathname === "/") {
      return new Response(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PSUB Worker</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
body {
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg,#0f172a,#1e293b);
  color:#fff;
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
  min-height:100vh;
  padding:20px;
}
h1 {
  font-size:3rem;
  margin-bottom:10px;
  color:#3b82f6;
}
p {
  color:#94a3b8;
  margin-bottom:30px;
  font-size:1.1rem;
}
.container {
  display:flex;
  flex-wrap:wrap;
  justify-content:center;
  gap:15px;
}
.button {
  padding:12px 25px;
  background:#3b82f6;
  color:#fff;
  border:none;
  border-radius:8px;
  font-size:1rem;
  text-decoration:none;
  cursor:pointer;
  transition:0.3s;
}
.button:hover {
  background:#2563eb;
}
.copy-btn {
  background:#10b981;
}
.copy-btn:hover {
  background:#059669;
}
input {
  width:300px;
  padding:10px;
  border-radius:6px;
  border:none;
  margin-top:20px;
  font-size:0.9rem;
}
</style>
</head>
<body>
<h1>PSUB Worker</h1>
<p>服务正在运行，选择你的订阅格式：</p>
<div class="container">
  <a class="button" href="/sub" target="_blank">原始订阅</a>
  <a class="button" href="/clash" target="_blank">Clash</a>
  <a class="button" href="/singbox" target="_blank">Sing-box</a>
  <a class="button" href="/v2rayn" target="_blank">V2rayN</a>
  <button class="button copy-btn" onclick="copySub()">复制订阅链接</button>
</div>
<input type="text" id="subInput" value="${SUB_URL}" readonly>
<script>
function copySub() {
  const input = document.getElementById('subInput');
  input.select();
  input.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(input.value).then(() => {
    alert('订阅链接已复制 🎉');
  });
}
</script>
</body>
</html>
`, {
        headers: { "content-type": "text/html;charset=UTF-8" },
      })
    }

    // =========================
    // 通用订阅
    // =========================
    if (url.pathname === "/sub") {
      return await proxySub(SUB_URL)
    }

    // =========================
    // Clash
    // =========================
    if (url.pathname === "/clash") {
      return await convertSub(SUB_URL, "clash")
    }

    // =========================
    // Sing-box
    // =========================
    if (url.pathname === "/singbox") {
      return await convertSub(SUB_URL, "singbox")
    }

    // =========================
    // V2rayN
    // =========================
    if (url.pathname === "/v2rayn") {
      return await proxySub(SUB_URL)
    }

    return new Response("404 Not Found", { status: 404 })
  },
}

// =========================
// 原始订阅代理
// =========================
async function proxySub(subUrl) {
  const response = await fetch(subUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
  })
  const text = await response.text()
  return new Response(text, { headers: { "content-type": "text/plain;charset=utf-8" } })
}

// =========================
// 订阅转换（subconverter）
// =========================
async function convertSub(subUrl, target) {
  const converter = "https://sub.xeton.dev/sub"
  const url = `${converter}?target=${target}&url=${encodeURIComponent(subUrl)}&insert=false&emoji=true&list=true`
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })
  const text = await response.text()
  return new Response(text, { headers: { "content-type": "text/plain;charset=utf-8" } })
}
