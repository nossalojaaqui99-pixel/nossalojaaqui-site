export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    // =========================
    // API - LISTAR PRODUTOS
    // =========================

    if (
      url.pathname === "/api/produtos" &&
      request.method === "GET"
    ) {

      try {

        const result = await env.DB
          .prepare(`
            SELECT *
            FROM products
            ORDER BY id DESC
          `)
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
              "Content-Type": "application/json; charset=UTF-8",
              "Access-Control-Allow-Origin": "*"
            }
          }
        );

      }

    }


    // =========================
    // API - SALVAR PRODUTO
    // =========================

    if (
      url.pathname === "/api/produtos" &&
      request.method === "POST"
    ) {

      try {

        const dados = await request.json();

        const nome = dados.name || "";
        const preco = dados.price || "";
        const categoria = dados.category || "";
        const imagem = dados.image_url || "";
        const link = dados.shopee_url || "";
        const descricao = dados.description || "";


        if (
          !nome ||
          !preco ||
          !categoria ||
          !imagem ||
          !link ||
          !descricao
        ) {

          return new Response(
            JSON.stringify({
              sucesso: false,
              erro: "Preencha todos os campos."
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json; charset=UTF-8",
                "Access-Control-Allow-Origin": "*"
              }
            }
          );

        }


        await env.DB
          .prepare(`
            INSERT INTO products
            (
              name,
              price,
              category,
              image_url,
              shopee_url,
              description
            )
            VALUES (?, ?, ?, ?, ?, ?)
          `)
          .bind(
            nome,
            preco,
            categoria,
            imagem,
            link,
            descricao
          )
          .run();


        return new Response(
          JSON.stringify({
            sucesso: true,
            mensagem: "Produto salvo com sucesso!"
          }),
          {
            status: 200,
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
              "Content-Type": "application/json; charset=UTF-8",
              "Access-Control-Allow-Origin": "*"
            }
          }
        );

      }

    }


    // =========================
    // ENTREGA O SITE
    // =========================

    return env.ASSETS.fetch(request);

  }
};
