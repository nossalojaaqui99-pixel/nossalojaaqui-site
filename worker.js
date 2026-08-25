var worker_default = {
  async fetch(request, env) {

    const url = new URL(request.url);

    // API DE PRODUTOS
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

    // ENTREGA O SITE PELOS ASSETS
    return env.ASSETS.fetch(request);

  }
};

export {
  worker_default as default
};
