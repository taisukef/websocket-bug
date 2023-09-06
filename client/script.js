const socket = new WebSocket('wss://' + document.location.host);
const user = self.crypto.randomUUID();

socket.onopen = () => {
    // サーバーに存在を知らせる
    socket.send(JSON.stringify({ type: "req", q: "did", body: user }));
    // サーバーに他のピアのIDを問い合わせる
    socket.send(JSON.stringify({ type: "req", q: "neighbours" }))
};

socket.onmessage = (e) => {
    const payload = JSON.parse(e.data);
    // 他のピアのIDの配列が返ってきた
    if (payload.type == "res") {
        payload.body.forEach((did) => {
            if (did == user) {
                return;
            }
            const con = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
            con.onicecandidate = e => {
                // ICE candidatesが出尽くしたとき
                if (!e.candidate) {
                    // offerを転送させる
                    socket.send(JSON.stringify({
                        type: "req", q: "transport", body: {
                            payload: JSON.stringify({ type: "req", q: "offer", body: { offer: con.localDescription, from: user } }), to: did
                        }
                    }))
                }
            }
            con.createDataChannel("sendChannel");
            con.createOffer()
                .then(offer => {
                    con.setLocalDescription(offer);
                });
        })
        return;
    }
    // offerが送られてきた(answerの算出は省略)
    console.log("hello");
    // answerの代わりに"hello"を送信
    socket.send("hello");
}