const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const qrcode = require("qrcode-terminal")
const fs = require("fs")

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    })

    sock.ev.on("connection.update", (update) => {
        const { connection, qr } = update

        if (qr) {
            console.log("Scan QR berikut:")
            qrcode.generate(qr, { small: true })
        }

        if (connection === "open") {
            console.log("Bot berhasil terhubung ✅")
        }
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message) return

        const from = msg.key.remoteJid
        const text = msg.message.conversation || ""

        const db = JSON.parse(fs.readFileSync("./promo.json"))

        // MENU
        if (text.toLowerCase() === "menu") {
            await sock.sendMessage(from, {
                text: `📋 *MENU PROMO*\n\n1. paling-murah\n2. tebus-heboh\n3. beli-banyak\n\nKetik salah satu ya 😉`
            })
        }

        // KATEGORI
        if (db[text.toLowerCase()]) {
            const data = db[text.toLowerCase()]

            await sock.sendMessage(from, {
                image: { url: data.image },
                caption: data.text
            })
        }
    })
}

startBot()
