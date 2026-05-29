export default {
  async fetch(request) {

    const url = new URL(request.url)

    if (url.pathname === "/") {
      return new Response(html(), {
        headers: {
          "content-type": "text/html;charset=utf-8"
        }
      })
    }

    if (url.pathname === "/convert") {

      const sub =
        url.searchParams.get("url")

      const target =
        url.searchParams.get("target") || "clash"

      if (!sub) {
        return new Response(
          "Missing url",
          { status:400 }
        )
      }

      return await convert(sub,target)
    }

    return new Response(
      "404 Not Found",
      { status:404 }
    )

  }
}

// 主转换
async function convert(subUrl,target){

  try{

    const res =
      await fetch(subUrl)

    let text =
      await res.text()

    // 自动 base64 解码
    try{
      if(
        !text.includes("://")
      ){
        text =
          atob(text.trim())
      }
    }catch{}

    const lines =
      text
      .split(/\r?\n/)
      .map(v=>v.trim())
      .filter(Boolean)

    // V2rayN
    if(target === "v2rayn"){

      return new Response(
        lines.join("\n"),
        {
          headers:{
            "content-type":
            "text/plain;charset=utf-8"
          }
        }
      )

    }

    // Clash
    if(target === "clash"){

      let yaml =
`mixed-port: 7890
allow-lan: true
mode: rule

proxies:
`

      const names = []

      for(const line of lines){

        const node =
          parseNode(line)

        if(!node) continue

        names.push(node.name)

        yaml +=
          clashNode(node)

      }

      yaml +=
`
proxy-groups:
  - name: Proxy
    type: select
    proxies:
`

      for(const name of names){

        yaml +=
`      - "${name}"
`

      }

      yaml +=
`
rules:
  - MATCH,Proxy
`

      return new Response(
        yaml,
        {
          headers:{
            "content-type":
            "text/yaml;charset=utf-8"
          }
        }
      )

    }

    // Sing-box
    if(target === "singbox"){

      const outbounds = []

      for(const line of lines){

        const node =
          parseNode(line)

        if(!node) continue

        outbounds.push(
          singboxNode(node)
        )

      }

      const config = {

        log:{
          level:"info"
        },

        outbounds:[

          {
            type:"selector",
            tag:"Proxy",
            outbounds:
              outbounds.map(
                v=>v.tag
              )
          },

          ...outbounds

        ]

      }

      return new Response(
        JSON.stringify(
          config,
          null,
          2
        ),
        {
          headers:{
            "content-type":
            "application/json"
          }
        }
      )

    }

    return new Response(
      "Invalid target",
      { status:400 }
    )

  }catch(e){

    return new Response(
      "Convert Error\n\n" + e,
      { status:500 }
    )

  }

}

// 节点解析
function parseNode(link){

  try{

    // vmess
    if(link.startsWith("vmess://")){

      const json =
        JSON.parse(
          atob(
            link.replace(
              "vmess://",
              ""
            )
          )
        )

      return {

        type:"vmess",

        name:
          json.ps || "vmess",

        server:
          json.add,

        port:
          Number(json.port),

        uuid:
          json.id,

        alterId:
          Number(json.aid || 0),

        network:
          json.net || "tcp",

        host:
          json.host || "",

        path:
          json.path || "/",

        tls:
          json.tls === "tls",

        sni:
          json.sni || "",

        fp:
          json.fp || "chrome"

      }

    }

    // vless / trojan
    const protocols = [
      "vless://",
      "trojan://"
    ]

    for(const p of protocols){

      if(link.startsWith(p)){

        const u =
          new URL(link)

        const params = {}

        for(
          const [k,v]
          of u.searchParams
        ){
          params[k] = v
        }

        return {

          type:
            p.replace(
              "://",
              ""
            ),

          name:
            decodeURIComponent(
              u.hash.replace("#","")
            ) || "node",

          server:
            u.hostname,

          port:
            Number(u.port),

          username:
            u.username,

          password:
            u.password,

          params

        }

      }

    }

    // ss
    if(link.startsWith("ss://")){

      const body =
        link.replace("ss://","")

      const tmp =
        body.split("#")

      const decoded =
        atob(tmp[0])

      const arr =
        decoded.split("@")

      const methodPass =
        arr[0]

      const hostPort =
        arr[1]

      return {

        type:"ss",

        name:
          decodeURIComponent(
            tmp[1] || "ss"
          ),

        server:
          hostPort.split(":")[0],

        port:
          Number(
            hostPort.split(":")[1]
          ),

        cipher:
          methodPass.split(":")[0],

        password:
          methodPass.split(":")[1]

      }

    }

  }catch{}

  return null

}

// Clash
function clashNode(node){

  // vmess
  if(node.type === "vmess"){

    return `
  - name: "${node.name}"
    type: vmess
    server: ${node.server}
    port: ${node.port}
    uuid: ${node.uuid}
    alterId: ${node.alterId}
    cipher: auto
    tls: ${node.tls}
    network: ${node.network}
    servername: ${node.sni}
    client-fingerprint: ${node.fp}
    udp: true
    ws-opts:
      path: "${node.path}"
      headers:
        Host: ${node.host}
`

  }

  // vless
  if(node.type === "vless"){

    return `
  - name: "${node.name}"
    type: vless
    server: ${node.server}
    port: ${node.port}
    uuid: ${node.username}
    tls: ${
      node.params.security === "tls"
    }
    network: ${
      node.params.type || "tcp"
    }
    servername: ${
      node.params.sni || ""
    }
    client-fingerprint: ${
      node.params.fp || "chrome"
    }
    udp: true
    ws-opts:
      path: "${
        node.params.path || "/"
      }"
      headers:
        Host: ${
          node.params.host || ""
        }
`

  }

  // trojan
  if(node.type === "trojan"){

    return `
  - name: "${node.name}"
    type: trojan
    server: ${node.server}
    port: ${node.port}
    password: ${node.username}
`

  }

  // ss
  if(node.type === "ss"){

    return `
  - name: "${node.name}"
    type: ss
    server: ${node.server}
    port: ${node.port}
    cipher: ${node.cipher}
    password: ${node.password}
`

  }

  return ""

}

// Sing-box
function singboxNode(node){

  // vmess
  if(node.type === "vmess"){

    return {

      type:"vmess",

      tag:node.name,

      server:node.server,

      server_port:node.port,

      uuid:node.uuid

    }

  }

  // vless
  if(node.type === "vless"){

    return {

      type:"vless",

      tag:node.name,

      server:node.server,

      server_port:node.port,

      uuid:node.username,

      tls:{
        enabled:
          node.params.security
          === "tls",

        server_name:
          node.params.sni || ""
      },

      transport:{
        type:
          node.params.type || "tcp",

        path:
          node.params.path || "/",

        headers:{
          Host:
            node.params.host || ""
        }
      }

    }

  }

  // trojan
  if(node.type === "trojan"){

    return {

      type:"trojan",

      tag:node.name,

      server:node.server,

      server_port:node.port,

      password:node.username

    }

  }

  // ss
  if(node.type === "ss"){

    return {

      type:"shadowsocks",

      tag:node.name,

      server:node.server,

      server_port:node.port,

      method:node.cipher,

      password:node.password

    }

  }

  return {}

}

// UI
function html(){

return `
<!DOCTYPE html>

<html lang="zh-CN">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width,initial-scale=1.0">

<title>PSUB</title>

<link
href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
rel="stylesheet">

<style>

*{
margin:0;
padding:0;
box-sizing:border-box
}

body{

background:
linear-gradient(
135deg,
#0f172a,
#111827,
#020617
);

font-family:
"Inter",
sans-serif;

min-height:100vh;

display:flex;

justify-content:center;

align-items:center;

padding:20px;

color:white

}

.card{

width:100%;

max-width:560px;

background:
rgba(17,24,39,.82);

backdrop-filter:
blur(18px);

border:
1px solid rgba(255,255,255,.06);

padding:36px;

border-radius:28px;

box-shadow:
0 10px 40px rgba(0,0,0,.45)

}

.logo{

font-size:52px;

font-weight:700;

text-align:center;

background:
linear-gradient(
90deg,
#60a5fa,
#818cf8,
#c084fc
);

-webkit-background-clip:text;

-webkit-text-fill-color:transparent;

margin-bottom:10px

}

.desc{

text-align:center;

color:#94a3b8;

margin-bottom:28px;

font-size:15px

}

.input,
.select{

width:100%;

padding:16px;

border:none;

outline:none;

border-radius:16px;

background:#1e293b;

color:white;

font-size:15px;

margin-bottom:18px

}

.input::placeholder{
color:#64748b
}

.btn{

width:100%;

padding:16px;

border:none;

border-radius:16px;

background:
linear-gradient(
90deg,
#2563eb,
#7c3aed
);

color:white;

font-size:16px;

font-weight:700;

cursor:pointer;

transition:.25s

}

.btn:hover{

transform:
translateY(-2px)

}

.result{

margin-top:22px;

background:#0f172a;

padding:18px;

border-radius:18px;

word-break:break-all;

white-space:pre-wrap;

font-size:13px;

max-height:260px;

overflow:auto;

line-height:1.6;

color:#93c5fd;

border:
1px solid rgba(255,255,255,.04)

}

.copy{

margin-top:16px;

width:100%;

padding:15px;

border:none;

border-radius:16px;

background:#0ea5e9;

color:white;

font-weight:700;

cursor:pointer

}

.footer{

margin-top:20px;

text-align:center;

font-size:12px;

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
Secure Cloudflare Subscription Converter
</div>

<input
id="sub"
class="input"
placeholder="输入订阅链接">

<select
id="target"
class="select">

<option value="clash">
Clash Meta
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

复制结果

</button>

<div class="footer">
Powered by Cloudflare Workers
</div>

</div>

<script>

async function gen(){

const sub =
document
.getElementById("sub")
.value

const target =
document
.getElementById("target")
.value

if(!sub){

alert("请输入订阅链接")

return

}

const api =
location.origin +
"/convert?target=" +
target +
"&url=" +
encodeURIComponent(sub)

const res =
await fetch(api)

const text =
await res.text()

document
.getElementById("result")
.innerText = text

}

function copyResult(){

const text =
document
.getElementById("result")
.innerText

navigator
.clipboard
.writeText(text)

alert("已复制")

}

</script>

</body>

</html>
`

}
