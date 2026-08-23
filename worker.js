export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/produtos") {
      const result = await env.DB.prepare(
        "SELECT * FROM produtos ORDER BY id DESC"
      ).all();

      return Response.json(result);
    }

    return new Response("Nossalojaaqui", {
      headers: {
        "Content-Type": "text/plain; charset=UTF-8"
      }
    });
  }
};
