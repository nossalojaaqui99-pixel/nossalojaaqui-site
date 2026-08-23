export default {
  async fetch(request, env) {
    try {
      const result = await env.DB
        .prepare("SELECT 1 AS teste")
        .run();

      return Response.json({
        sucesso: true,
        banco: "D1 conectado",
        resultado: result
      });
    } catch (error) {
      return Response.json({
        sucesso: false,
        erro: error.message
      }, { status: 500 });
    }
  }
};
