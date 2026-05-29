/**
 * Subconverter Worker 完整示例
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // -----------------------
    // 后台管理 /admin
    // -----------------------
    if (url.pathname === "/admin") {
      if (request.method === "POST") {
        try {
          const form = await request.formData()
          const sub = form.get("sub")?.trim()
          if (!sub) return new Response("请输入订阅地址", { status: 400 })

          // 保存到 KV
          await env.SUB_DB.put("sub", sub)
          return new Response("订阅保存成功")
        } catch (e) {
          return new Response("保存失败：" + e.toString(), { status: 500 })
        }
      }

      // GET 返回简单后台页面
      const saved = await env.SUB_DB.get("sub") || ""
      return new Response(`
        <html>
          <body>
            <h2>订阅管理面板</h2>
            <form method="POST">
              订阅地址:<br>
              <input type="text" name="sub" value="${saved}" style="width:80%">
              <input type="submit" value="保存">
            </form>
            <p>订阅获取地址: /sub</p>
          </body>
        </html>
      `, { headers: { "content-type": "text/html;charset=utf-8" } })
    }

    // -----------------------
    // 订阅输出 /sub
    // -----------------------
    if (url.pathname === "/sub") {
      try {
        const sub = await env.SUB_DB.get("sub")
        if (!sub) return new Response("未设置订阅地址", { status: 400 })

        // 防止填写自己的 /sub 导致无限递归
        if (sub.includes(url.hostname)) {
          return new Response("订阅地址不能指向自己", { status: 400 })
        }

        // 获取订阅内容
        const resp = await fetch(sub)
        if (!resp.ok) return new Response("订阅请求失败 HTTP " + resp.status, { status: 500 })

        const text = await resp.text()

        return new Response(text, {
          headers: {
            "content-type": "text/plain;charset=utf-8",
            "Access-Control-Allow-Origin": "*"
          }
        })
      } catch (e) {
        return new Response("订阅获取失败：\n\n" + e.toString(), { status: 500 })
      }
    }

    // -----------------------
    // 根目录首页
    // -----------------------
    return new Response(`
      <html>
        <body>
          <h2>Sub Worker 正常运行</h2>
          <p>后台: <a href="/admin">/admin</a></p>
          <p>订阅: <a href="/sub">/sub</a></p>
        </body>
      </html>
    `, { headers: { "content-type": "text/html;charset=utf-8" } })
  }
}
