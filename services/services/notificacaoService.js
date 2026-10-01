const admin = require('./firebase');

async function enviarNotificacaoUrgenteFeirante(tokenFCM, dados) {
  if (!admin.apps.length) {
    console.warn("⚠️ Firebase não inicializado. Pulando envio de push.");
    return;
  }

  const message = {
    token: tokenFCM,
    notification: {
      title: dados.titulo || '🚨 ALERTA DA FEIRA!',
      body: dados.mensagem || `Evento no Pedido #${dados.pedido_id}`,
    },
    data: {
      pedido_id: String(dados.pedido_id),
      tipo: dados.tipo || 'NOVO_PEDIDO'
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'sirene',
        channelId: 'feira_alertas_urgentes',
        priority: 'max'
      }
    }
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Push enviado via FCM:', response);
  } catch (error) {
    console.error('❌ Erro ao enviar Push FCM:', error);
  }
}

module.exports = { enviarNotificacaoUrgenteFeirante };
