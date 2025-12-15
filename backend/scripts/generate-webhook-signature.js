#!/usr/bin/env node

/**
 * Script para generar y probar firmas de webhook de Mercado Pago
 * Uso: node generate-webhook-signature.js [secret] [request-id] [timestamp]
 */

const crypto = require('crypto');

function generateSignature(requestId, timestamp, secret) {
  const dataToSign = `${requestId}.${timestamp}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(dataToSign);
  return hmac.digest('hex');
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Generador de Firmas para Webhooks de Mercado Pago\n');
    console.log('Uso: node generate-webhook-signature.js <secret> [request-id] [timestamp]\n');
    console.log('Ejemplo:');
    console.log(
      '  node generate-webhook-signature.js "mi_webhook_secret_12345"\n',
    );
    console.log('Si no proporciona request-id y timestamp, se generarán automáticamente.\n');
    process.exit(1);
  }

  const secret = args[0];
  const requestId = args[1] || `test_request_${Date.now()}`;
  const timestamp = args[2] || Math.floor(Date.now() / 1000).toString();

  const signature = generateSignature(requestId, timestamp, secret);

  console.log('📋 Firma de Webhook de Mercado Pago\n');
  console.log(`Secret:     ${secret}`);
  console.log(`Request ID: ${requestId}`);
  console.log(`Timestamp:  ${timestamp}`);
  console.log(`\nFirma generada (x-signature):`);
  console.log(`${signature}\n`);

  // Generar el comando curl completo
  const curlCommand = `curl -X POST http://localhost:3000/billing/webhook/mercadopago \\
  -H "Content-Type: application/json" \\
  -H "x-request-id: ${requestId}" \\
  -H "x-signature: ${signature}" \\
  -d '{
    "type": "preapproval",
    "data": {
      "id": "test_preapproval_123"
    }
  }' \\
  "?timestamp=${timestamp}"`;

  console.log('💻 Comando curl para probar:\n');
  console.log(curlCommand);
  console.log('\n');

  // Generar un JavaScript snippet para testing
  const jsSnippet = `const payload = {
  headers: {
    'x-request-id': '${requestId}',
    'x-signature': '${signature}',
  },
  query: { timestamp: '${timestamp}' },
  body: {
    type: 'preapproval',
    data: { id: 'test_preapproval_123' }
  }
};`;

  console.log('🧪 Snippet para Testing:\n');
  console.log(jsSnippet);
  console.log('\n');
}

main();
