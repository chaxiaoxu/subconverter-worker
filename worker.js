export default {

  async fetch(request, env) {

    const url = new URL(request.url)

    // 后台
    if (url.pathname === "/admin") {

      const current = await env.SUB_DB.get("sub")

      return new Response(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sub Worker</title>

<style>

body{
  font-family:sans-serif;
  background:#f5f5f5;
  padding:20px;
}

.card{
  max-width:800px;
  margin:auto;
  background:white;
  padding:20px;
  border-radius:12px;
  box-shadow:0 2px 10px rgba(0,0,0,.08);
}

input{
  width:100%;
  padding:12px;
  border:1px solid #ddd;
  border-radius:8px;
  margin-bottom:12px;
  box-sizing:border-box;
}

button{
  background:#111;
  color:white;
  border:none;
  padding:12px 20px;
  border-radius:8px;
}

pre{
  background:#eee;
  padding:12px;
  border-radius:8px;
  overflow:auto;
}

</style>

</head>

<body>

<div class="card">

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

<h3>订阅地址</h3>

<pre>${url.origin}/sub</pre>

</div>

</body>
</html>
      `, {
        headers:{
          "content-type":"text/html;charset=utf-8"
        }
      })
    }

    // 保存
    if (url.pathname === "/save") {

      try {

        const form = await request.formData()

        const sub = form.get("url") || ""

        await env.SUB_DB.put("sub", sub)

        return Response.redirect(
          url.origin + "/admin",
          302
        )

      } catch (e) {

        return new Response(
          "保存失败:\n\n" + e.toString(),
          {
            status:500
          }
        )

      }
    }

    // 获取订阅
    if (url.pathname === "/sub") {

      try {

        const sub = await env.SUB_DB.get("sub")

        if (!sub) {

          return new Response(
            "未设置订阅地址",
            {
              status:400
            }
          )

        }

        const resp = await fetch(sub, {
          headers:{
            "User-Agent":"Mozilla/5.0"
          }
        })

        if (!resp.ok) {

          return new Response(
            "订阅请求失败 HTTP " + resp.status,
            {
              status:500
            }
          )

        }

        const text = await resp.text()

        return new Response(text, {
          status:200,
          headers:{
            "content-type":"text/plain;charset=utf-8",
            "Access-Control-Allow-Origin":"*"
          }
        })

      } catch (e) {

        return new Response(
          "订阅获取失败:\n\n" + e.toString(),
          {
            status:500
          }
        )

      }
    }

    // 首页
    return new Response(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Sub Worker</title>
</head>

<body>

<h2>Sub Worker 正常运行</h2>

<p>后台：</p>

<pre>/admin</pre>

<p>订阅：</p>

<pre>/sub</pre>

</body>
</html>
    `, {
      headers:{
        "content-type":"text/html;charset=utf-8"
      }
    })

  }

}        headers:{
          "content-type":"text/html;charset=utf-8"
        }
      })
    }

    // =========================
    // 保存订阅
    // =========================

    if (url.pathname === "/save") {

      try {

        const form = await request.formData()

        const sub = form.get("url") || ""

        await env.SUB_DB.put("sub", sub)

        return Response.redirect(
          url.origin + "/admin",
          302
        )

      } catch (e) {

        return new Response(
          "保存失败:\n\n" + e.toString(),
          {
            status:500
          }
        )

      }
    }

    // =========================
    // 获取订阅
    // =========================

    if (url.pathname === "/sub") {

      try {

        const sub = await env.SUB_DB.get("sub")

        if (!sub) {

          return new Response(
            "未设置订阅地址",
            {
              status:400
            }
          )

        }

        const resp = await fetch(sub, {
          headers:{
            "User-Agent":"Mozilla/5.0"
          }
        })

        if (!resp.ok) {

          return new Response(
            "订阅请求失败 HTTP " + resp.status,
            {
              status:500
            }
          )

        }

        let text = await resp.text()

        // =========================
        // 自动识别 Base64
        // =========================

        try {

          const decoded = atob(text.trim())

          if (
            decoded.includes("vmess://") ||
            decoded.includes("vless://") ||
            decoded.includes("trojan://") ||
            decoded.includes("ss://")
          ) {

            text = btoa(decoded)

          }

        } catch {}

        return new Response(text, {
          status:200,
          headers:{
            "content-type":"text/plain;charset=utf-8",
            "Access-Control-Allow-Origin":"*"
          }
        })

      } catch (e) {

        return new Response(
          "订阅获取失败:\n\n" + e.toString(),
          {
            status:500
          }
        )

      }
    }

    // =========================
    // 首页
    // =========================

    return new Response(`

<!DOCTYPE html>
<html>

<head>

<meta charset="utf-8">

<meta name="viewport" content="width=device-width, initial-scale=1">

<title>Sub Worker</title>

<style>

body{
  font-family:sans-serif;
  background:#f5f5f5;
  padding:30px;
}

.card{
  max-width:700px;
  margin:auto;
  background:white;
  padding:30px;
  border-radius:12px;
  box-shadow:0 2px 10px rgba(0,0,0,.08);
}

pre{
  background:#eee;
  padding:12px;
  border-radius:8px;
}

</style>

</head>

<body>

<div class="card">

<h2>Sub Worker 运行正常</h2>

<p>后台地址：</p>

<pre>/admin</pre>

<p>订阅地址：</p>

<pre>/sub</pre>

</div>

</body>
</html>

    `, {
      headers:{
        "content-type":"text/html;charset=utf-8"
      }
    })

  }

}        headers:{
          "content-type":"text/html;charset=utf-8"
        }
      })
    }

    // =========================
    // 保存订阅
    // =========================

    if (url.pathname === "/save") {

      try {

        const form = await request.formData()

        const sub = form.get("url") || ""

        await env.SUB_DB.put("sub", sub)

        return Response.redirect(
          url.origin + "/admin",
          302
        )

      } catch (e) {

        return new Response(
          "保存失败:\n\n" + e.toString(),
          {
            status:500
          }
        )

      }
    }

    // =========================
    // 获取订阅
    // =========================

    if (url.pathname === "/sub") {

      try {

        const sub = await env.SUB_DB.get("sub")

        if (!sub) {

          return new Response(
            "未设置订阅地址",
            {
              status:400
            }
          )

        }

        const resp = await fetch(sub, {
          headers:{
            "User-Agent":"Mozilla/5.0"
          }
        })

        if (!resp.ok) {

          return new Response(
            "订阅请求失败 HTTP " + resp.status,
            {
              status:500
            }
          )

        }

        let text = await resp.text()

        // =========================
        // 自动识别 Base64
        // =========================

        try {

          const decoded = atob(text.trim())

          if (
            decoded.includes("vmess://") ||
            decoded.includes("vless://") ||
            decoded.includes("trojan://") ||
            decoded.includes("ss://")
          ) {

            text = btoa(decoded)

          }

        } catch {}

        return new Response(text, {
          status:200,
          headers:{
            "content-type":"text/plain;charset=utf-8",
            "Access-Control-Allow-Origin":"*"
          }
        })

      } catch (e) {

        return new Response(
          "订阅获取失败:\n\n" + e.toString(),
          {
            status:500
          }
        )

      }
    }

    // =========================
    // 首页
    // =========================

    return new Response(`

<!DOCTYPE html>
<html>

<head>

<meta charset="utf-8">

<meta name="viewport" content="width=device-width, initial-scale=1">

<title>Sub Worker</title>

<style>

body{
  font-family:sans-serif;
  background:#f5f5f5;
  padding:30px;
}

.card{
  max-width:700px;
  margin:auto;
  background:white;
  padding:30px;
  border-radius:12px;
  box-shadow:0 2px 10px rgba(0,0,0,.08);
}

pre{
  background:#eee;
  padding:12px;
  border-radius:8px;
}

</style>

</head>

<body>

<div class="card">

<h2>Sub Worker 运行正常</h2>

<p>后台地址：</p>

<pre>/admin</pre>

<p>订阅地址：</p>

<pre>/sub</pre>

</div>

</body>
</html>

    `, {
      headers:{
        "content-type":"text/html;charset=utf-8"
      }
    })

  }

}
