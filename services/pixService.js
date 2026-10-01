const axios = require('axios');

class PixPayloadGenerator {
  constructor({ chavePix, nomeRecebedor, cidadeRecebedor, valor, txid = '***' }) {
    this.chavePix = chavePix;
    this.nomeRecebedor = nomeRecebedor.substring(0, 25);
    this.cidadeRecebedor = cidadeRecebedor.substring(0, 15);
    this.valor = parseFloat(valor).toFixed(2);
    this.txid = txid;
  }

  formatarCampo(id, valor) {
    const len = valor.length.toString().padStart(2, '0');
    return `${id}${len}${valor}`;
  }

  gerarPayload() {
    const gui = this.formatarCampo('00', 'br.gov.bcb.pix');
    const chave = this.formatarCampo('01', this.chavePix);
    const merchantAccountInfo = this.formatarCampo('26', `${gui}${chave}`);
    const txidCampo = this.formatarCampo('05', this.txid);
    const additionalData = this.formatarCampo('62', txidCampo);

    let payload = 
      this.formatarCampo('00', '01') +
      merchantAccountInfo +
      this.formatarCampo('52', '0000') +
      this.formatarCampo('53', '986') +
      this.formatarCampo('54', this.valor) +
      this.formatarCampo('58', 'BR') +
      this.formatarCampo('59', this.nomeRecebedor) +
      this.formatarCampo('60', this.cidadeRecebedor) +
      additionalData +
      '6304';

    const crc16 = this.calcularCRC16(payload);
    return `${payload}${crc16}`;
  }

  calcularCRC16(payload) {
    let crc = 0xFFFF;
    const polynomial = 0x1021;
    for (let i = 0; i < payload.length; i++) {
      let b = payload.charCodeAt(i);
      for (let j = 0; j < 8; j++) {
        let bit = ((b >> (7 - j)) & 1) == 1;
        let c15 = ((crc >> 15) & 1) == 1;
        crc <<= 1;
        if (c15 ^ bit) crc ^= polynomial;
      }
    }
    crc &= 0xFFFF;
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
}

module.exports = { PixPayloadGenerator };
