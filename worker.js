export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/produtos") {
      try {
        const result = await env.DB
          .prepare("SELECT * FROM products ORDER BY id DESC")
          .all();

        return new Response(
          JSON.stringify({
            sucesso: true,
            produtos: result.results
          }),
          {
            headers: {
              "Content-Type": "application/json; charset=UTF-8",
              "Access-Control-Allow-Origin": "*"
            }
          }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({
            sucesso: false,
            erro: error.message
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json; charset=UTF-8"
            }
          }
        );
      }
    }

    return new Response("Nossalojaaqui", {
      headers: {
        "Content-Type": "text/plain; charset=UTF-8"
      }
    });
  }
};
