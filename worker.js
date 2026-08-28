export default {
  async fetch(request, env) {

    const url = new URL(request.url);
    if (!env.SHOPEE_APP_ID || !env.SHOPEE_SECRET) {
  return jsonResponse({
    sucesso: false,
    erro: "Credenciais da Shopee não estão disponíveis no Worker."
  }, 500);
}

    // =========================================
    // CABEÇALHOS JSON
    // =========================================

    function jsonResponse(data, status = 200) {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // =========================================
    // CORS
    // =========================================

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

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

        return jsonResponse({
          sucesso: true,
          produtos: result.results
        });

      } catch (error) {

        return jsonResponse({
          sucesso: false,
          erro: error.message
        }, 500);

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

          return jsonResponse({
            sucesso: false,
            erro:
              "Preencha nome, preço, categoria e link da Shopee."
          }, 400);

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

        return jsonResponse({
          sucesso: true,
          mensagem: "Produto salvo com sucesso!"
        });

      } catch (error) {

        return jsonResponse({
          sucesso: false,
          erro: error.message
        }, 500);

      }
    }

    // =========================================
    // BUSCAR PRODUTO SHOPEE
    // =========================================

    if (
      url.pathname === "/api/shopee/buscar" &&
      request.method === "POST"
    ) {

      try {

        if (!env.SHOPEE_APP_ID || !env.SHOPEE_SECRET) {

          return jsonResponse({
            sucesso: false,
            erro:
              "SHOPEE_APP_ID ou SHOPEE_SECRET não configurado no Cloudflare."
          }, 500);

        }

        const dados = await request.json();

        const link = String(dados.link || "").trim();

        if (!link) {

          return jsonResponse({
            sucesso: false,
            erro: "Cole o link do produto da Shopee."
          }, 400);

        }

        // -----------------------------------------
        // Extrair Shop ID e Item ID
        // -----------------------------------------

        let shopId = null;
        let itemId = null;

        // Formato:
        // shopee.com.br/xxxxx-i.1494995608.44507205958

        let match = link.match(
          /-i\.(\d+)\.(\d+)/
        );

        if (match) {

          shopId = match[1];
          itemId = match[2];

        }

        // Formato:
        // /product/1494995608/44507205958

        if (!itemId) {

          match = link.match(
            /\/product\/(\d+)\/(\d+)/
          );

          if (match) {

            shopId = match[1];
            itemId = match[2];

          }
        }

        // -----------------------------------------
        // Se for link curto
        // -----------------------------------------

        if (!itemId && link.includes("s.shopee.com.br")) {

          try {

            const respostaRedirect =
              await fetch(link, {
                method: "GET",
                redirect: "manual"
              });

            const location =
              respostaRedirect.headers.get("location");

            if (location) {

              match = location.match(
                /-i\.(\d+)\.(\d+)/
              );

              if (match) {

                shopId = match[1];
                itemId = match[2];

              }

              if (!itemId) {

                match = location.match(
                  /\/product\/(\d+)\/(\d+)/
                );

                if (match) {

                  shopId = match[1];
                  itemId = match[2];

                }
              }
            }

          } catch (erroRedirect) {
            // Continua para a mensagem abaixo
          }
        }

        if (!itemId) {

          return jsonResponse({
            sucesso: false,
            erro:
              "Não consegui identificar o ID do produto nesse link. Use o link completo da Shopee."
          }, 400);

        }

        // -----------------------------------------
        // GraphQL
        // -----------------------------------------

        const query = `
          {
            productOfferV2(
              itemId: ${itemId}
              shopId: ${shopId || 0}
              limit: 1
            ) {
              nodes {
                itemId
                commissionRate
                commission
                price
                sales
                imageUrl
                productName
                shopName
                productLink
                offerLink
                priceMin
                priceMax
                productCatIds
                ratingStar
                priceDiscountRate
                shopId
                shopType
                sellerCommissionRate
                shopeeCommissionRate
              }

              pageInfo {
                page
                limit
                hasNextPage
                scrollId
              }
            }
          }
        `;

        const payload =
          JSON.stringify({
            query
          });

        // -----------------------------------------
        // Assinatura Shopee
        // -----------------------------------------

        const timestamp =
          Math.floor(Date.now() / 1000);

        const textoAssinatura =
          env.SHOPEE_APP_ID +
          timestamp +
          payload +
          env.SHOPEE_SECRET;

        const encoder =
          new TextEncoder();

        const dadosAssinatura =
          encoder.encode(textoAssinatura);

        const hashBuffer =
          await crypto.subtle.digest(
            "SHA-256",
            dadosAssinatura
          );

        const assinatura =
          Array.from(
            new Uint8Array(hashBuffer)
          )
            .map(
              byte =>
                byte
                  .toString(16)
                  .padStart(2, "0")
            )
            .join("");

        // -----------------------------------------
        // Chamada API Shopee
        // -----------------------------------------

        const resposta =
          await fetch(
            "https://open-api.affiliate.shopee.com.br/graphql",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                "Authorization":
                  `SHA256 Credential=${env.SHOPEE_APP_ID}, Timestamp=${timestamp}, Signature=${assinatura}`
              },

              body: payload
            }
          );

        const texto =
          await resposta.text();

        let resultado;

        try {

          resultado =
            JSON.parse(texto);

        } catch (erroJSON) {

          return jsonResponse({
            sucesso: false,
            erro:
              "A Shopee retornou uma resposta que não é JSON.",
            status: resposta.status,
            resposta: texto.substring(0, 500)
          }, 502);

        }

        // -----------------------------------------
        // Erro da Shopee
        // -----------------------------------------

        if (resultado.errors) {

          return jsonResponse({
            sucesso: false,
            erro:
              resultado.errors[0]?.message ||
              "Erro retornado pela API da Shopee.",
            detalhes:
              resultado.errors
          }, 400);

        }

        const produtos =
          resultado?.data?.productOfferV2?.nodes || [];

        if (!produtos.length) {

          return jsonResponse({
            sucesso: false,
            erro:
              "A Shopee não encontrou esse produto na API de Afiliados.",
            itemId,
            shopId
          }, 404);

        }

        const produto = produtos[0];

        // -----------------------------------------
        // Resultado para o painel
        // -----------------------------------------

        return jsonResponse({
          sucesso: true,

          produto: {
            itemId:
              produto.itemId,

            shopId:
              produto.shopId,

            nome:
              produto.productName || "",

            preco:
              produto.price || "",

            precoMin:
              produto.priceMin || "",

            precoMax:
              produto.priceMax || "",

            imagem:
              produto.imageUrl || "",

            loja:
              produto.shopName || "",

            link:
              produto.productLink || link,

            linkAfiliado:
              produto.offerLink || "",

            desconto:
              produto.priceDiscountRate || 0,

            avaliacao:
              produto.ratingStar || "",

            comissao:
              produto.commissionRate || ""
          }
        });

      } catch (error) {

        return jsonResponse({
          sucesso: false,
          erro: error.message
        }, 500);

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
          erro: "Link da Shopee não informado."
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

    // Extrai Shop ID e Item ID do link da Shopee
    const match = link.match(/(?:i\.|item\/)(\d+)(?:\.|\/)(\d+)/i);

    if (!match) {
      return new Response(
        JSON.stringify({
          sucesso: false,
          erro: "Não foi possível identificar o produto no link da Shopee."
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

    const shopId = match[1];
    const itemId = match[2];

    // Query GraphQL da Shopee
    const query = `
      {
        productOfferV2(
          itemId: ${itemId},
          shopId: ${shopId}
        ) {
          nodes {
            itemId
            commissionRate
            commission
            price
            sales
            imageUrl
            productName
            shopName
            productLink
            offerLink
            priceMin
            priceMax
            ratingStar
            priceDiscountRate
            shopId
            sellerCommissionRate
            shopeeCommissionRate
          }
          pageInfo {
            page
            limit
            hasNextPage
            scrollId
          }
        }
      }
    `;

    const payload = JSON.stringify({
      query: query
    });

    const timestamp = Math.floor(Date.now() / 1000);

    // Assinatura Shopee
    const assinaturaTexto =
      env.SHOPEE_APP_ID +
      timestamp +
      payload +
      env.SHOPEE_SECRET;

    const encoder = new TextEncoder();

    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(assinaturaTexto)
    );

    const hashArray = Array.from(
      new Uint8Array(hashBuffer)
    );

    const signature = hashArray
      .map(
        byte => byte.toString(16).padStart(2, "0")
      )
      .join("");

    const respostaShopee = await fetch(
      "https://open-api.affiliate.shopee.com.br/graphql",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization":
            `SHA256 Credential=${env.SHOPEE_APP_ID}, Timestamp=${timestamp}, Signature=${signature}`
        },

        body: payload
      }
    );

    const texto = await respostaShopee.text();

    let resultado;

    try {
      resultado = JSON.parse(texto);
    } catch {
      throw new Error(
        "A Shopee retornou uma resposta inválida."
      );
    }

    if (resultado.errors) {

      return new Response(
        JSON.stringify({
          sucesso: false,
          erro:
            resultado.errors[0]?.message ||
            "Erro retornado pela API da Shopee."
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

    const nodes =
      resultado?.data?.productOfferV2?.nodes || [];

    if (!nodes.length) {

      return new Response(
        JSON.stringify({
          sucesso: false,
          erro:
            "A Shopee não encontrou uma oferta para este produto. Verifique se o produto está disponível para afiliados."
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    const produtoShopee = nodes[0];

    // Formato usado pelo painel admin
    const produto = {

      nome:
        produtoShopee.productName || "",

      preco:
        produtoShopee.price || "",

     imagem:
  produtoShopee.imageUrl || null,

      descricao:
        produtoShopee.productName || "",

      categoria:
        "Outros",

      cores:
        "",

      tamanhos:
        "",

      link:
        produtoShopee.offerLink ||
        produtoShopee.productLink ||
        link,

      shopName:
        produtoShopee.shopName || "",

      commissionRate:
        produtoShopee.commissionRate || "",

      commission:
        produtoShopee.commission || "",

      ratingStar:
        produtoShopee.ratingStar || "",

      sales:
        produtoShopee.sales || 0,

      itemId:
        produtoShopee.itemId || itemId,

      shopId:
        produtoShopee.shopId || shopId
    };

    return new Response(
      JSON.stringify({
        sucesso: true,
        produto: produto
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
