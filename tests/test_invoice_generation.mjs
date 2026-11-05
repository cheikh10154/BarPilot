// tests/test_invoice_generation.mjs
import handler from '../api/generate-invoice.js';

async function runTests() {
  console.log('--- TEST INVOICE GENERATION SYSTEM ---');

  // Test 1: Monthly Recurring Invoice (HTML)
  {
    const req = {
      method: 'GET',
      query: { variant: 'recurring', format: 'html' }
    };

    let responseData = '';
    let responseStatus = 200;
    const res = {
      setHeader: () => {},
      status: (code) => {
        responseStatus = code;
        return {
          send: (html) => { responseData = html; },
          json: (data) => { responseData = data; }
        };
      }
    };

    await handler(req, res);
    console.log(`[Test 1] Recurring Invoice Status: ${responseStatus}`);
    if (
      responseData.includes('BarPilot · Gestionale per Bar & Ristoranti') &&
      responseData.includes('02799820036') &&
      responseData.includes('admin@barpilot.eu') &&
      responseData.includes('FATTURA MENSILE RICORRENTE') &&
      responseData.includes('48.36') &&
      responseData.includes('10.64') &&
      responseData.includes('59.00')
    ) {
      console.log('✅ [Test 1 Passed] Company credentials and recurring invoice format verified.');
    } else {
      console.error('❌ [Test 1 Failed] Missing expected content in recurring invoice:');
      console.error(responseData.substring(0, 500));
      process.exit(1);
    }
  }

  // Test 2: Post-Trial Invoice after 14-day trial (HTML)
  {
    const req = {
      method: 'GET',
      query: { variant: 'post_trial', format: 'html' }
    };

    let responseData = '';
    let responseStatus = 200;
    const res = {
      setHeader: () => {},
      status: (code) => {
        responseStatus = code;
        return {
          send: (html) => { responseData = html; },
          json: (data) => { responseData = data; }
        };
      }
    };

    await handler(req, res);
    console.log(`[Test 2] Post-Trial Invoice Status: ${responseStatus}`);
    if (
      responseData.includes('PRIMA FATTURA (ATTIVAZIONE POST-TRIAL 14 GG)') &&
      responseData.includes('Primo canone post-periodo di prova gratuita (14 giorni inclusi)') &&
      responseData.includes('BarPilot · Gestionale per Bar & Ristoranti') &&
      responseData.includes('02799820036') &&
      responseData.includes('admin@barpilot.eu')
    ) {
      console.log('✅ [Test 2 Passed] Post-Trial 14 days invoice format verified.');
    } else {
      console.error('❌ [Test 2 Failed] Missing expected content in post-trial invoice.');
      process.exit(1);
    }
  }

  // Test 3: JSON Format (for API / Integration)
  {
    const req = {
      method: 'GET',
      query: { variant: 'recurring', format: 'json' }
    };

    let responseData = null;
    const res = {
      setHeader: () => {},
      status: () => ({
        json: (data) => { responseData = data; }
      })
    };

    await handler(req, res);
    if (
      responseData &&
      responseData.company.piva === '02799820036' &&
      responseData.company.email === 'admin@barpilot.eu' &&
      responseData.invoice.total === 59.00
    ) {
      console.log('✅ [Test 3 Passed] JSON Invoice API verified.');
    } else {
      console.error('❌ [Test 3 Failed] Invalid JSON response:', responseData);
      process.exit(1);
    }
  }

  console.log('🎉 ALL INVOICE TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
