// Test for Welcome Email Endpoint and Generation
import assert from 'assert';
import http from 'http';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const welcomeHandler = require('../api/send-welcome-email.js');

console.log('================================================================');
console.log('🧪 TEST SUITE: BARPILOT WELCOME EMAIL SERVICE');
console.log('================================================================\n');

// Mock request and response helpers
function createMockReqRes({ method, body }) {
  const req = {
    method,
    headers: { 'content-type': 'application/json' },
    on(event, cb) {
      if (event === 'data' && body) {
        cb(Buffer.from(JSON.stringify(body)));
      }
      if (event === 'end') {
        cb();
      }
    }
  };

  let statusCode = 200;
  let headers = {};
  let responseData = '';

  const res = {
    setHeader(k, v) { headers[k] = v; },
    writeHead(code, h) { statusCode = code; if (h) Object.assign(headers, h); },
    status(code) { statusCode = code; return res; },
    json(obj) { responseData = JSON.stringify(obj); return res; },
    end(data) { if (data) responseData = data; return res; },
    getStatusCode() { return statusCode; },
    getBody() { return responseData ? JSON.parse(responseData) : null; }
  };

  return { req, res };
}

// 1. Test validation on missing email
const { req: req1, res: res1 } = createMockReqRes({ method: 'POST', body: { barName: 'Bar Milano' } });
await welcomeHandler(req1, res1);
assert.strictEqual(res1.getStatusCode(), 400, 'Must return 400 when email is missing');
console.log('✅ Test 1: Validazione email mancante corretta (400 Bad Request)');

// 2. Test valid welcome email generation
const testPayload = {
  email: 'gestore@barcentrale.it',
  ownerName: 'Marco Rossi',
  barName: 'Bar Centrale Roma',
  city: 'Roma',
  phone: '+39 333 1234567'
};

const { req: req2, res: res2 } = createMockReqRes({ method: 'POST', body: testPayload });
await welcomeHandler(req2, res2);

assert.strictEqual(res2.getStatusCode(), 200, 'Must return 200 OK');
const body2 = res2.getBody();
assert.strictEqual(body2.success, true, 'Result success must be true');
assert.strictEqual(body2.recipient, 'gestore@barcentrale.it', 'Recipient must match');
assert.strictEqual(body2.barName, 'Bar Centrale Roma', 'Bar name must match');
assert(body2.subject.includes('Bar Centrale Roma'), 'Subject must mention the bar name');
console.log('✅ Test 2: Invio email di benvenuto riuscito con subject personalizzato:', body2.subject);

// 3. Test GET health check
const { req: req3, res: res3 } = createMockReqRes({ method: 'GET' });
await welcomeHandler(req3, res3);
assert.strictEqual(res3.getStatusCode(), 200, 'GET must return 200');
const body3 = res3.getBody();
assert.strictEqual(body3.status, 'ok', 'Health check status must be ok');
console.log('✅ Test 3: Health check GET /api/send-welcome-email funzionante');

console.log('\n================================================================');
console.log('🎉 ALL WELCOME EMAIL TESTS PASSED SUCCESSFULLY!');
console.log('================================================================');
