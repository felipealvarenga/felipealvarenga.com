// Serve the static site on felipealvarenga.com; send every other host (www, .com.br) to the canonical one.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname !== "felipealvarenga.com") {
      url.hostname = "felipealvarenga.com";
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
