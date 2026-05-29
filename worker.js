export default {

  async fetch(request) {

    const url =
      new URL(request.url)

    // 首页
    if (url.pathname === "/") {

      return new Response(
        html(),
        {
          headers:{
            "content-type":
            "text/html;charset=utf-8"
          }
        }
      )

    }

    // 转换接口
    if (url.pathname === "/convert") {

      const sub =
        url.searchParams.get("url")

      const target =
        url.searchParams.get("target")
        || "clash"

      if (!sub) {

        return new Response(
          "Missing url",
          { status:400 }
        )

      }

      return await convert(
        sub,
        target
      )

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

    // base64 自动解码
    if(
      !text.includes("proxies:")
      &&
      !text.includes("outbounds")
    ){

      try{

        text =
          atob(
            text.trim()
          )

      }catch{}

    }

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

// 通用解析
function parseNode(link){

  try{

    // vmess
    if(
      link.startsWith(
        "vmess://"
      )
    ){

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
          json.fp || ""

      }

    }

    // 通用 URL 协议
    const protocols = [

      "vless://",
      "trojan://",
      "tuic://",
      "hy2://",
      "hysteria2://"

    ]

    for(const p of protocols){

      if(
        link.startsWith(p)
      ){

        const u =
          new URL(
            link
            .replace(
              "hy2://",
              "https://"
            )
            .replace(
              "hysteria2://",
              "https://"
            )
          )

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
              u.hash.replace(
                "#",
                ""
              )
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
    if(
      link.startsWith(
        "ss://"
      )
    ){

      const body =
        link.replace(
          "ss://",
          ""
        )

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

      const method =
        methodPass.split(":")[0]

      const password =
        methodPass.split(":")[1]

      const host =
        hostPort.split(":")[0]

      const port =
        Number(
          hostPort.split(":")[1]
        )

      return {

        type:"ss",

        name:
          decodeURIComponent(
            tmp[1] || "ss"
          ),

        server:host,

        port,

        cipher:method,

        password

      }

    }

  }catch{}

  return null

}

// Clash 输出
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
    network: ${node.network}
    tls: ${node.tls}
    udp: true
    servername: ${node.sni}
    client-fingerprint: ${node.fp}
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
    udp: true
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

// Sing-box 输出
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
          node.params.sni || "",

        utls:{
          enabled:true,
          fingerprint:
            node.params.fp
            || "chrome"
        }
      },

      transport:{
        type:
          node.params.type
          || "tcp",

        path:
          node.params.path
          || "/",

        headers:{
          Host:
            node.params.host
            || ""
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

// 页面
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

<style>

*{
margin:0;
padding:0;
box-sizing:border-box
}

body{
background:#0f172a;
height:100vh;
display:flex;
justify-content:center;
align-items:center;
font-family:sans-serif;
padding:20px;
color:white
}

.card{
width:100%;
max-width:520px;
background:#111827;
padding:35px;
border-radius:24px;
box-shadow:0 0 40px rgba(0,0,0,.45)
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
cursor:pointer
}

.result{
margin-top:20px;
background:#1e293b;
padding:15px;
border-radius:12px;
word-break:break-all;
white-space:pre-wrap;
font-size:13px;
max-height:240px;
overflow:auto;
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

复制结果

</button>

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
