const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

const serviceAccountPath = process.env.FIREBASE_CREDENTIALS_PATH || path.join(__dirname, 'serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (e) {
  console.warn("⚠️ Aviso: Arquivo serviceAccountKey.json do Firebase não encontrado. Push notifications via FCM estarão desativadas até configurar a chave.");
}

module.exports = admin;
