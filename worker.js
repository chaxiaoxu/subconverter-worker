export default {
  async fetch(request) {
    const url = new URL(request.url)

    // 真实订阅
    const SUB_URL =
      "https://pages-879.pages.dev/386bab19-4a72-4fe2-b5c6-eb98701333a6/sub"

    // 首页
    if (url.pathname === "/") {
      return new Response(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PSUB</title>

<style>
*{
margin:0;
padding:0;
box-sizing:border-box
}

body{
background:#0f172a;
font-family:sans-serif;
color:white;
height:100vh;
display:flex;
justify-content:center;
align-items:center;
padding:20px
}

.card{
width:100%;
max-width:500px;
background:#111827;
border-radius:20px;
padding:40px;
box-shadow:0 0 40px rgba(0,0,0,.4);
text-align:center
}

.logo{
font-size:42px;
font-weight:bold;
margin-bottom:10px;
background:linear-gradient(90deg,#60a5fa,#818cf8);
-webkit-background-clip:text;
-webkit-text-fill-color:transparent
}

.desc{
color:#94a3b8;
margin-bottom:35px
}

.btn{
display:block;
width:100%;
padding:15px;
margin-bottom:15px;
border-radius:12px;
text-decoration:none;
font-size:17px;
font-weight:bold;
transition:.25s;
background:#1e293b;
color:white
}

.btn:hover{
transform:translateY(-2px);
background:#2563eb
}

.footer{
margin-top:20px;
font-size:13px;
color:#64748b
}
</style>
</head>

<body>

<div class="card">

<div class="logo">PSUB</div>

<div class="desc">
Cloudflare Subscription Service
</div>

<a class="btn" href="/sub">
原始订阅
</a>

<a class="btn" href="/clash">
Clash 订阅
</a>

<a class="btn" href="/singbox">
Sing-box 订阅
</a>

<a class="btn" href="/v2rayn">
V2rayN 订阅
</a>

<div class="footer">
Service Running
</div>

</div>

</body>
</html>
`,
{
headers:{
"content-type":"text/html;charset=UTF-8"
}
})
    }

    // 原始订阅
    if (url.pathname === "/sub") {
      return await proxySub(SUB_URL)
    }

    // Clash
    if (url.pathname === "/clash") {
      return await convertSub(SUB_URL, "clash")
    }

    // Sing-box
    if (url.pathname === "/singbox") {
      return await convertSub(SUB_URL, "singbox")
    }

    // V2rayN
    if (url.pathname === "/v2rayn") {
      return await proxySub(SUB_URL)
    }

    return new Response("404 Not Found", {
      status: 404,
    })
  },
}

// 原始订阅代理
async function proxySub(subUrl) {
  const response = await fetch(subUrl)

  const text = await response.text()

  return new Response(text, {
    headers: {
      "content-type": "text/plain;charset=utf-8",
    },
  })
}

// 订阅转换
async function convertSub(subUrl, target) {

  const converter =
    "https://api.v1.mk/sub"

  const url =
    `${converter}?target=${target}&url=${encodeURIComponent(subUrl)}&insert=false&emoji=true&list=true`

  const response = await fetch(url)

  const text = await response.text()

  return new Response(text, {
    headers: {
      "content-type": "text/plain;charset=utf-8",
    },
  })
}
