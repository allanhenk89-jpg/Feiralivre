const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { enviarNotificacaoUrgenteFeirante } = require('./services/notificacaoService');
const { PixPayloadGenerator } = require('./services/pixService');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Controle de conexões Socket.io por Salas
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);

  socket.on('join_feirante_room', (feiranteId) => {
    socket.join(`feirante_${feiranteId}`);
    console.log(`🎯 Socket ${socket.id} entrou na sala: feirante_${feiranteId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Desconectado: ${socket.id}`);
  });
});

// Rota de Criação de Pedido com Geração de Pix
app.post('/api/pedidos', (req, res) => {
  const { feirante_id, itens, total, cliente_nome, chave_pix } = req.body;
  const pedidoId = Math.floor(Math.random() * 90000) + 10000;

  // Gera Pix Payload
  const pixGen = new PixPayloadGenerator({
    chavePix: chave_pix || 'sua-chave-pix@feiralivre.com',
    nomeRecebedor: 'Feira Livre Digital',
    cidadeRecebedor: 'Sao Paulo',
    valor: total,
    txid: `PEDIDO${pedidoId}`
  });

  const pedido = {
    id: pedidoId,
    feirante_id,
    cliente_nome,
    itens,
    total,
    pixCopiaECola: pixGen.gerarPayload(),
    status: 'AGUARDANDO_PAGAMENTO',
    criado_em: new Date().toISOString()
  };

  // Notifica o feirante em tempo real via WebSocket
  io.to(`feirante_${feirante_id}`).emit('novo_pedido_recebido', pedido);

  res.status(201).json({ sucesso: true, pedido });
});

// Rota de Webhook do Pix (Banco)
app.post('/api/webhooks/pix', (req, res) => {
  res.status(200).send({ status: 'ok' });

  const pixData = req.body.pix ? req.body.pix[0] : (req.body.payment || req.body);
  const txid = pixData.txid || pixData.id || 'PEDIDO1042';

  // Simulação de confirmação disparada para a sala do feirante
  const dadosConfirmacao = {
    pedido_id: 1042,
    feirante_id: 'feirante-uuid-123',
    cliente_nome: 'Consumidor Teste',
    valor: 45.00,
    txid: txid,
    pago_em: new Date().toLocaleTimeString('pt-BR')
  };

  io.to(`feirante_${dadosConfirmacao.feirante_id}`).emit('pix_pago_confirmado', dadosConfirmacao);
});

// Rota de Abertura de Reclamação ("Tive um Problema")
app.post('/api/cliente/reclamacao', (req, res) => {
  const { pedido_id, feirante_id, motivo, comentario } = req.body;

  const payloadAlerta = {
    pedido_id,
    feirante_id,
    motivo,
    comentario,
    criado_em: new Date().toISOString()
  };

  // Emite o alerta sonoro e visual imediato no painel do feirante
  io.to(`feirante_${feirante_id}`).emit('novo_problema_notificacao', payloadAlerta);

  res.status(201).json({ sucesso: true, mensagem: "Reclamação enviada com sucesso." });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
