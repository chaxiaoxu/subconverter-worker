export default {

  async fetch(request, env) {

    const url = new URL(request.url)

    // 管理后台
    if (url.pathname === "/admin") {

      const current = await env.SUB_DB.get("sub")

      return new Response(`
<!DOCTYPE html>
<html>

<head>
<meta charset="utf-8">
<title>订阅管理面板</title>

<style>

body{
  font-family:sans-serif;
  padding:20px;
}

input{
  width:100%;
  padding:10px;
  margin-bottom:10px;
}

button{
  padding:10px 20px;
}

pre{
  background:#f3f3f3;
  padding:10px;
  overflow:auto;
}

</style>

</head>

<body>

<h2>订阅管理面板</h2>

<form method="POST" action="/save">

<input
  type="text"
  name="url"
  value="${current || ""}"
  placeholder="输入订阅地址"
/>

<button type="submit">
保存
</button>

</form>

<hr>

<p>订阅获取地址：</p>

<pre>
/sub
</pre>

<p>完整订阅地址：</p>

<pre>
${url.origin}/sub
</pre>

</body>
</html>
      `, {
        headers: {
          "content-type": "text/html;charset=utf-8"
        }
      })
    }

    // 保存订阅
    if (url.pathname === "/save") {

      try {

        const form = await request.formData()

        const sub = form.get("url") || ""

        await env.SUB_DB.put("sub", sub)

        return new Response(`
保存成功

<a href="/admin">
返回后台
</a>
