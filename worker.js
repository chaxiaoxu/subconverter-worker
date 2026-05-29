export default {
  async fetch(request) {

    const url = new URL(request.url)

    // 首页
    if (url.pathname === "/") {

      return new Response(`

<!DOCTYPE html>
<html lang="zh-CN">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width,initial-scale=1.0">

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

height:100vh;

display:flex;

justify-content:center;

align-items:center;

padding:20px;

color:white

}

.card{

width:100%;

max-width:520px;

background:#111827;

padding:35px;

border-radius:24px;

box-shadow:0 0 45px rgba(0,0,0,.45)

}

.logo{

font-size:44px;

font-weight:bold;

text-align:center;

margin-bottom:12px;

background:linear-gradient(
90deg,
#60a5fa,
#818cf8
);

-webkit-background-clip:text;

-webkit-text-fill-color:transparent

}

.desc{

text-align:center;

color:#94a3b8;

margin-bottom:25px

}

.input{

width:100%;

padding:15px;

border:none;

border-radius:12px;

background:#1e293b;

color:white;

font-size:15px;

margin-bottom:18px

}

.select{

width:100%;

padding:15px;

border:none;

border-radius:12px;

background:#1e293b;

color:white;

font-size:15px;

margin-bottom:18px

}

.btn{

width:100%;

padding:15px;

border:none;

border-radius:12px;

background:#2563eb;

color:white;

font-size:16px;

font-weight:bold;

cursor:pointer;

transition:.25s

}

.btn:hover{

background:#3b82f6

}

.result{

margin-top:20px;

background:#1e293b;

padding:15px;

border-radius:12px;

word-break:break-all;

font-size:14px;

color:#93c5fd

}

.copy{

margin-top:14px;

width:100%;

padding:13px;

border:none;

border-radius:12px;

background:#0ea5e9;

color:white;

font-weight:bold;

cursor:pointer

}

.footer{

margin-top:18px;

text-align:center;

font-size:13px;

color:#64748b

}

</style>

</head>

<body>

<div class="card">

<div class="logo">
PSUB
</div>

<div class="desc">
Cloudflare Subscription Convert
</div>

<input

id="sub"

class="input"

placeholder="输入订阅链接">

<select

id="target"

class="select">

<option value="clash">
Clash
</option>

<option value="singbox">
Sing-box
</option>

<option value="v2rayn">
V2rayN
</option>

</select>

<button

class="btn"

onclick="gen()">

生成订阅

</button>

<div

id="result"

class="result">

生成结果会显示在这里

</div>

<button

class="copy"

onclick="copyResult()">

复制链接

</button>

<div class="footer">

Service Running

</div>

</div>

<script>

function gen(){

const sub =
document.getElementById("sub").value

const target =
document.getElementById("target").value

if(!sub){

alert("请输入订阅链接")

return

}

const link =
location.origin +
"/convert?target=" +
target +
"&url=" +
encodeURIComponent(sub)

document.getElementById("result")
.innerText = link

}

function copyResult(){

const text =
document.getElementById("result")
.innerText

navigator.clipboard.writeText(text)

alert("已复制")

}

</script>

</body>

</html>

`,
{
headers:{
"content-type":"text/html;charset=UTF-8"
}
})

    }

    // 转换接口
    if (url.pathname === "/convert") {

      const sub =
        url.searchParams.get("url")

      const target =
        url.searchParams.get("target") || "clash"

      if (!sub) {

        return new Response(
          "Missing subscription url",
          { status:400 }
        )

      }

      return await convertSub(
        sub,
        target
      )

    }

    return new Response(
      "404 Not Found",
      { status:404 }
    )

  },
}

// 订阅转换
async function convertSub(subUrl, target) {

  const converter =
    "https://api.v1.mk/sub"

  const url =
`${converter}?target=${target}&url=${encodeURIComponent(subUrl)}&insert=false&emoji=true&list=true`

  const response =
    await fetch(url)

  const text =
    await response.text()

  return new Response(text,{
    headers:{
      "content-type":"text/plain;charset=utf-8"
    }
  })

}
