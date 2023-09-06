const cons = {};
Deno.serve({
    port: 443,
    cert: await Deno.readTextFile("/etc/letsencrypt/live/wab.sabae.cc/fullchain.pem"),
    key: await Deno.readTextFile("/etc/letsencrypt/live/wab.sabae.cc/privkey.pem")
}, async (req) => {
    const upgrade = req.headers.get("upgrade") || "";
    if (upgrade.toLowerCase() == "websocket") {
        const { socket, response } = Deno.upgradeWebSocket(req);
        socket.onmessage = async (e) => {
            // "hello"が出力されない
            console.log(e.data.slice(0, 8));
            const payload = JSON.parse(e.data);
            switch (payload.q) {
                // クライアントがIDを名乗った
                case "did":
                    cons[payload.body] = socket;
                    break;
                // ピアのIDの一覧を要求された
                case "neighbours":
                    socket.send(JSON.stringify({ type: "res", body: Object.keys(cons) }));
                    break;
                // offer/answerの転送を要求された
                case "transport":
                    try { cons[payload.body.to].send(payload.body.payload); } catch (err) { };
                    break;
            }
        };
        return response;
    } else {
        let path = (new URL(req.url)).pathname;
        if (path == "/") path = "/index.html";
        const data = await Deno.readTextFile("client" + path);
        return new Response(data, { headers: new Headers({ "Content-Type": path.split(".").pop() == "html" ? "text/html" : "text/javascript" }) });
    }
});