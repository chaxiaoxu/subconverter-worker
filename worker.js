export default {

  async fetch(request, env) {

    const url = new URL(request.url)

    // 管理页面
    if (url.pathname === "/admin") {

      const current = await env.SUB_DB.get("sub")

      return new Response(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>订阅管理</title>
</head>
<body>

<h2>订阅管理面板</h2>

<form method="POST" action="/save">

  <input
    type="text"
    name="url"
    value="${current || ""}"
    placeholder="输入订阅地址"
    style="width:90%"
  />

  <button type="submit">
    保存
  </button>

</form>

<p>订阅地址：</p>

<pre>/sub</pre>

</body>
</html>
      `, {
        headers: {
          "content-type": "text/html;charset=utf-8"
        }
      })
    }

    // 保存
    if (url.pathname === "/save") {

      const form = await request.formData()

      const sub = form.get("url") || ""

      await env.SUB_DB.put("sub", sub)

      return new Response("保存成功")
    }

    // 获取订阅
    if (url.pathname === "/sub") {

      const sub = await env.SUB_DB.get("sub")

      if (!sub) {
        return new Response("未设置订阅")
      }

      const resp = await fetch(sub)

      const text = await resp.text()

      return new Response(text, {
        headers: {
          "content-type": "text/plain;charset=utf-8"
        }
      })
    }

    return new Response("404")
  }
}
