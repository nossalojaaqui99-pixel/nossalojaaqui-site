export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/produtos") {
      try {
        const result = await env.DB
          .prepare("SELECT * FROM produtos ORDER BY id DESC")
          .all();

        return Response.json({
          sucesso: true,
          produtos: result.results
        });

      } catch (error) {
        return Response.json({
          sucesso: false,
          erro: error.message
        }, { status: 500 });
      }
    }

    return new Response("Nossalojaaqui", {
      headers: {
        "Content-Type": "text/plain; charset=UTF-8"
      }
    });
  }
};
if (url.pathname === "/api/produtos") {
  FROM products
