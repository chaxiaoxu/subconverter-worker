function parseNode(link){

try{

// vmess
if(link.startsWith("vmess://")){

const json =
JSON.parse(
atob(
link.replace("vmess://","")
)
)

return {
type:"vmess",
name:json.ps || "vmess",
server:json.add,
port:Number(json.port),
uuid:json.id,
alterId:Number(json.aid || 0),
cipher:"auto",

network:json.net || "tcp",
host:json.host || "",
path:json.path || "/",
tls:json.tls === "tls",
sni:json.sni || "",
alpn:json.alpn || "",
fp:json.fp || ""

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

if(link.startsWith(p)){

const u =
new URL(
link
.replace("hy2://","https://")
.replace("hysteria2://","https://")
)

const params = {}

for(const [k,v] of u.searchParams){

params[k] = v

}

return {

type:
p.replace("://",""),

name:
decodeURIComponent(
u.hash.replace("#","")
) || "node",

server:u.hostname,

port:Number(u.port),

username:u.username,

password:u.password,

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
