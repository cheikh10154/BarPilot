// tests/test_support_ticket.mjs
import handler from '../api/create-ticket.js';

async function runTests() {
  console.log('--- TEST SUPPORT TICKET SYSTEM ---');

  // Test 1: Validation failure on missing fields
  {
    const req = {
      method: 'POST',
      body: { fullName: 'Mario Rossi' } // missing email, subject, message
    };
    let statusCode = 200;
    let responseData = null;
    const res = {
      setHeader: () => {},
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => { responseData = data; }
        };
      }
    };

    await handler(req, res);
    if (statusCode === 400 && responseData.error) {
      console.log('✅ [Test 1 Passed] Validation error returned for incomplete form.');
    } else {
      console.error('❌ [Test 1 Failed] Expected status 400 for missing fields:', statusCode, responseData);
      process.exit(1);
    }
  }

  // Test 2: Successful ticket creation
  {
    const req = {
      method: 'POST',
      body: {
        fullName: 'Cheikh Gueye',
        email: 'admin@barpilot.eu',
        subject: 'Configurazione KDS cucina & comande',
        message: 'Richiesta assistenza per configurare il secondo tablet in cucina.',
        category: 'KDS Banco',
        priority: 'high',
        barId: 'bar_centrale_01'
      }
    };
    let statusCode = 200;
    let responseData = null;
    const res = {
      setHeader: () => {},
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => { responseData = data; }
        };
      }
    };

    await handler(req, res);
    console.log(`[Test 2] Create Ticket Status: ${statusCode}`);
    if (statusCode === 200 && responseData.success && responseData.ticketId.startsWith('tkt_')) {
      console.log(`✅ [Test 2 Passed] Ticket created successfully: ${responseData.ticketId}`);
    } else {
      console.error('❌ [Test 2 Failed] Ticket creation failed:', statusCode, responseData);
      process.exit(1);
    }
  }

  console.log('🎉 ALL SUPPORT TICKET TESTS PASSED!');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
