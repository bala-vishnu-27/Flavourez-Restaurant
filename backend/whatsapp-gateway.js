// ============================================================
// backend/whatsapp-gateway.js — Flavourez Real WhatsApp Gateway
// Powered by @whiskeysockets/baileys & QR Code
// ============================================================
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

class WhatsAppGateway {
  constructor() {
    this.sock = null;
    this.status = 'DISCONNECTED'; // 'DISCONNECTED' | 'SCAN_QR' | 'CONNECTED' | 'CONNECTING'
    this.qrCodeDataUrl = null;
    this.connectedUser = null;
    this.authDir = path.join(__dirname, '..', '.wa_auth');
    this.db = null;
    this.isInitializing = false;
    this.reconnectTimer = null;
  }

  setDatabase(database) {
    this.db = database;
  }

  getStatus() {
    return {
      status: this.status,
      qr: this.qrCodeDataUrl,
      user: this.connectedUser,
      authExists: fs.existsSync(this.authDir)
    };
  }

  broadcastStatus() {
    if (global.wss) {
      const payload = JSON.stringify({
        type: 'WA_GATEWAY_STATUS',
        gateway: this.getStatus()
      });
      global.wss.clients.forEach(client => {
        if (client.readyState === 1) client.send(payload);
      });
    }
  }

  normalizeNumber(phoneNumber) {
    const digits = (phoneNumber || '').toString().replace(/\D/g, '');
    const raw10 = digits.slice(-10); // Always extract the actual 10-digit Indian mobile number
    return {
      raw10,
      full91: '91' + raw10,
      jid: `91${raw10}@s.whatsapp.net`
    };
  }

  async initialize() {
    if (this.isInitializing) return;
    this.isInitializing = true;

    try {
      this.status = 'CONNECTING';
      this.broadcastStatus();

      if (!fs.existsSync(this.authDir)) {
        fs.mkdirSync(this.authDir, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

      this.sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        browser: ['Flavourez Restaurant', 'Chrome', '1.0.0'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 25000
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            this.qrCodeDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 7 });
            this.status = 'SCAN_QR';
            console.log('\n📲 [WHATSAPP GATEWAY] New QR Code Ready. View & Scan in Admin Dashboard!');
            this.broadcastStatus();
          } catch (err) {
            console.error('Error generating QR code image:', err);
          }
        }

        if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          
          this.status = 'DISCONNECTED';
          this.qrCodeDataUrl = null;
          this.connectedUser = null;
          this.broadcastStatus();

          console.log(`🔌 [WHATSAPP GATEWAY] Connection closed (Reason: ${statusCode || 'Unknown'}). Reconnecting: ${shouldReconnect}`);

          if (shouldReconnect) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = setTimeout(() => {
              this.isInitializing = false;
              this.initialize();
            }, statusCode === 440 ? 8000 : 3000);
          } else {
            // Clean up session if logged out
            try {
              fs.rmSync(this.authDir, { recursive: true, force: true });
            } catch (e) {}
            console.log('🚪 [WHATSAPP GATEWAY] Session logged out. Ready for new scan.');
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = setTimeout(() => {
              this.isInitializing = false;
              this.initialize();
            }, 2000);
          }
        } else if (connection === 'open') {
          this.status = 'CONNECTED';
          this.qrCodeDataUrl = null;
          const userJid = this.sock.user?.id || '';
          this.connectedUser = userJid.split(':')[0] || userJid.split('@')[0];
          console.log(`\n✅ [WHATSAPP GATEWAY ONLINE] Successfully linked to WhatsApp: +${this.connectedUser}`);
          this.broadcastStatus();
        }
      });

    } catch (err) {
      console.error('❌ [WHATSAPP GATEWAY INIT ERROR]:', err.message);
      this.status = 'DISCONNECTED';
      this.broadcastStatus();
    } finally {
      this.isInitializing = false;
    }
  }

  async sendDirectMessage(phoneNumber, messageText, customerName = '', trackingId = '') {
    const { raw10, full91, jid } = this.normalizeNumber(phoneNumber);

    console.log(`\n🚀 [WHATSAPP DISPATCH] Target: +91 ${raw10} (${customerName || 'Customer'})`);

    let sendSuccess = false;
    let errorDetail = '';

    // If socket is connecting, wait up to 4 seconds for ready state
    if (this.sock && this.status !== 'CONNECTED') {
      let attempts = 0;
      while (attempts < 8 && this.status !== 'CONNECTED') {
        await new Promise(r => setTimeout(r, 500));
        attempts++;
      }
    }

    if (this.sock && this.status === 'CONNECTED') {
      try {
        await this.sock.sendMessage(jid, { text: messageText });
        sendSuccess = true;
        console.log(`✅ [WHATSAPP DELIVERED] Real WhatsApp message sent to +91 ${raw10}!`);
      } catch (err) {
        console.error(`❌ [WHATSAPP SEND FAILED]:`, err.message);
        errorDetail = err.message;
      }
    } else {
      console.log(`⚠️ [WHATSAPP GATEWAY NOTICE] Gateway offline/reconnecting. Status: ${this.status}`);
      errorDetail = 'Gateway offline / reconnecting';
    }

    const finalStatus = sendSuccess ? 'DELIVERED ✅' : (this.status === 'CONNECTED' ? 'FAILED ❌' : 'QUEUED / LOGGED 📋');

    // Save to Database WhatsApp Logs (with clean normalized phone)
    if (this.db) {
      try {
        this.db.prepare('INSERT INTO whatsapp_logs (tracking_id, phone, customer_name, message, status) VALUES (?,?,?,?,?)')
          .run(trackingId || 'DIRECT', full91, customerName || 'Customer', messageText, finalStatus);
      } catch (e) {
        console.error('Error logging to DB:', e.message);
      }
    }

    // Broadcast to Admin Dashboard Live
    if (global.wss) {
      global.wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'WHATSAPP_DISPATCHED',
            tracking_id: trackingId,
            recipient: customerName,
            phone: full91,
            status: finalStatus,
            delivered: sendSuccess,
            error: errorDetail
          }));
        }
      });
    }

    return {
      success: sendSuccess,
      status: finalStatus,
      recipient: full91,
      error: errorDetail
    };
  }

  async logout() {
    try {
      if (this.sock) {
        await this.sock.logout();
      }
      try {
        fs.rmSync(this.authDir, { recursive: true, force: true });
      } catch (e) {}
      this.status = 'DISCONNECTED';
      this.qrCodeDataUrl = null;
      this.connectedUser = null;
      this.broadcastStatus();
      setTimeout(() => {
        this.isInitializing = false;
        this.initialize();
      }, 1500);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

const gateway = new WhatsAppGateway();
module.exports = gateway;
