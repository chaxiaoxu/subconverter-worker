export default {
  async fetch(request) {
    const url = new URL(request.url)

    // =========================
    // 你的真实订阅
    // =========================
    const SUB_URL =
      "https://pages-879.pages.dev/386bab19-4a72-4fe2-b5c6-eb98701333a6/sub"

    // =========================
    // 主页伪装
    // =========================
    if (url.pathname === "/") {
      return new Response(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Welcome</title>
<style>
body{
background:#0f172a;
color:#fff;
display:flex;
justify-content:center;
align-items:center;
height:100vh;
font-family:sans-serif;
flex-direction:column
}
h1{font-size:48px}
p{opacity:.7}
</style>
</head>
<body>
<h1>Cloudflare Worker</h1>
<p>Service Running...</p>
</body>
</html>
`, {
        headers: {
          "content-type": "text/html;charset=UTF-8",
        },
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

    return new Response("404 Not Found", {
      status: 404,
    })
  },
}

// =========================
// 原始订阅代理
// =========================
async function proxySub(subUrl) {
  const response = await fetch(subUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0",
    },
  })

  const text = await response.text()

  return new Response(text, {
    headers: {
      "content-type": "text/plain;charset=utf-8",
    },
  })
}

// =========================
// 订阅转换
// 使用 subconverter
// =========================
async function convertSub(subUrl, target) {
  const converter =
    "https://sub.xeton.dev/sub"

  const url =
    `${converter}?target=${target}&url=${encodeURIComponent(subUrl)}&insert=false&emoji=true&list=true`

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0",
    },
  })

  const text = await response.text()

  return new Response(text, {
    headers: {
      "content-type": "text/plain;charset=utf-8",
    },
  })
}
