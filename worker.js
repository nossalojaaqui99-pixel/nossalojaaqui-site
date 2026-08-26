export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    // =========================================
    // LISTAR PRODUTOS
    // =========================================

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


    // =========================================
    // BUSCAR PRODUTO SHOPEE
    // =========================================

    if (
      url.pathname === "/api/shopee-produto" &&
      request.method === "POST"
    ) {

      try {

        const dados = await request.json();

        const link = dados.url || "";

        if (!link) {

          return new Response(
            JSON.stringify({
              sucesso: false,
              erro: "Informe o link do produto."
            }),
            {
              status: 400,
              headers: {
                "Content-Type":
                  "application/json; charset=UTF-8",
                "Access-Control-Allow-Origin":
                  "*"
              }
            }
          );

        }

        /*
         * Neste momento não fazemos scraping da Shopee.
         *
         * Retornamos o link em JSON para que o painel
         * não receba uma resposta vazia ou HTML.
         */

        return new Response(
          JSON.stringify({
            sucesso: false,
            erro:
              "A busca automática de dados da Shopee ainda não está configurada. Cole o link e preencha os dados do produto manualmente."
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json; charset=UTF-8",
              "Access-Control-Allow-Origin":
                "*"
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
              "Content-Type":
                "application/json; charset=UTF-8",
              "Access-Control-Allow-Origin":
                "*"
            }
          }
        );

      }
    }


    // =========================================
    // SALVAR PRODUTO
    // =========================================

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
        const cores = dados.colors || "";
        const tamanhos = dados.sizes || "";

        if (
          !nome ||
          !preco ||
          !categoria ||
          !link
        ) {

          return new Response(
            JSON.stringify({
              sucesso: false,
              erro:
                "Preencha nome, preço, categoria e link do produto."
            }),
            {
              status: 400,
              headers: {
                "Content-Type":
                  "application/json; charset=UTF-8",
                "Access-Control-Allow-Origin":
                  "*"
              }
            }
          );

        }

        await env.DB
          .prepare(`
            INSERT INTO products
            (
              name,
              description,
              image_url,
              shopee_url,
              price,
              category,
              colors,
              sizes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            nome,
            descricao,
            imagem,
            link,
            preco,
            categoria,
            cores,
            tamanhos
          )
          .run();

        return new Response(
          JSON.stringify({
            sucesso: true,
            mensagem:
              "Produto salvo com sucesso!"
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json; charset=UTF-8",
              "Access-Control-Allow-Origin":
                "*"
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
              "Content-Type":
                "application/json; charset=UTF-8",
              "Access-Control-Allow-Origin":
                "*"
            }
          }
        );

      }
    }


    // =========================================
    // ARQUIVOS DO SITE
    // =========================================

    if (env.ASSETS) {

      return env.ASSETS.fetch(request);

    }

    return new Response(
      "Assets não configurados",
      {
        status: 500,
        headers: {
          "Content-Type":
            "text/plain; charset=UTF-8"
        }
      }
    );

  }
};
