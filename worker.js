export default {
  async fetch(request) {

    const url = new URL(request.url)

    const target = url.searchParams.get("url")

    if (!target) {
      return new Response(
        "Usage: ?url=订阅地址",
        { status: 400 }
      )
    }

    try {

      const response = await fetch(target, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      })

      const data = await response.text()

      return new Response(data, {
        status: 200,
        headers: {
          "content-type": "text/plain;charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        }
      })

    } catch (e) {

      return new Response(
        "Fetch Error: " + e.toString(),
        { status: 500 }
      )

    }
  }
}
