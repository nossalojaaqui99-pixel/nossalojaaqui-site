var worker_default = {

  async fetch(request, env) {

    const url = new URL(request.url);

    // ==========================================
    // CORS
    // ==========================================

    if (request.method === "OPTIONS") {

      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });

    }


    // ==========================================
    // API DE PRODUTOS
    // ==========================================

    if (url.pathname === "/api/produtos") {

      // ========================================
      // LISTAR PRODUTOS
      // ========================================

      if (request.method === "GET") {

        try {

          const result = await env.DB
            .prepare(
              "SELECT * FROM products ORDER BY id DESC"
            )
            .all();


          return new Response(

            JSON.stringify({
              sucesso: true,
              produtos: result.results
            }),

            {
              headers: {
                "Content-Type":
                  "application/json; charset=UTF-8",

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
                "Content-Type":
                  "application/json; charset=UTF-8",

                "Access-Control-Allow-Origin": "*"
              }
            }

          );

        }

      }


      // ========================================
      // ADICIONAR PRODUTO
      // ========================================

      if (request.method === "POST") {

        try {

          const dados = await request.json();


          const nome =
            dados.name ||
            dados.nome ||
            "";


          const descricao =
            dados.description ||
            dados.descricao ||
            "";


          const preco =
            dados.price ||
            dados.preco ||
            "";


          const categoria =
            dados.category ||
            dados.categoria ||
            "";


          const imagem =
            dados.image_url ||
            dados.imagem ||
            "";


          const link =
            dados.shopee_url ||
            dados.link ||
            "";


          if (!nome) {

            return new Response(

              JSON.stringify({
                sucesso: false,
                erro: "O nome do produto é obrigatório."
              }),

              {
                status: 400,

                headers: {
                  "Content-Type":
                    "application/json; charset=UTF-8",

                  "Access-Control-Allow-Origin": "*"
                }
              }

            );

          }


          // ====================================
          // VERIFICAR COLUNAS
          // ====================================

          const colunas = await env.DB
            .prepare("PRAGMA table_info(products)")
            .all();


          const nomesColunas =
            colunas.results.map(
              coluna => coluna.name
            );


          // ====================================
          // CRIAR COLUNA PRICE SE NÃO EXISTIR
          // ====================================

          if (!nomesColunas.includes("price")) {

            await env.DB
              .prepare(
                "ALTER TABLE products ADD COLUMN price TEXT"
              )
              .run();

          }


          // ====================================
          // CRIAR COLUNA CATEGORY SE NÃO EXISTIR
          // ====================================

          if (!nomesColunas.includes("category")) {

            await env.DB
              .prepare(
                "ALTER TABLE products ADD COLUMN category TEXT"
              )
              .run();

          }


          // ====================================
          // INSERIR PRODUTO
          // ====================================

          const resultado = await env.DB

            .prepare(`
              INSERT INTO products
              (
                name,
                description,
                image_url,
                shopee_url,
                price,
                category
              )

              VALUES (?, ?, ?, ?, ?, ?)
            `)

            .bind(
              nome,
              descricao,
              imagem,
              link,
              preco,
              categoria
            )

            .run();


          return new Response(

            JSON.stringify({

              sucesso: true,

              mensagem:
                "Produto salvo com sucesso!",

              id:
                resultado.meta.last_row_id

            }),

            {

              status: 200,

              headers: {

                "Content-Type":
                  "application/json; charset=UTF-8",

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

                "Content-Type":
                  "application/json; charset=UTF-8",

                "Access-Control-Allow-Origin": "*"

              }

            }

          );

        }

      }


      // ========================================
      // MÉTODO NÃO PERMITIDO
      // ========================================

      return new Response(

        JSON.stringify({

          sucesso: false,

          erro: "Método não permitido."

        }),

        {

          status: 405,

          headers: {

            "Content-Type":
              "application/json; charset=UTF-8",

            "Access-Control-Allow-Origin": "*"

          }

        }

      );

    }


    // ==========================================
    // ENTREGA O SITE PELOS ASSETS
    // ==========================================

    return env.ASSETS.fetch(request);

  }

};


export {

  worker_default as default

};
