// ==========================================================================
// BarPilot - Real Google Pay & Google Wallet Service (Stripe Gateway)
// ==========================================================================

const DEFAULT_STRIPE_LIVE_PK = "pk_live_51RpuNaPFZ2dvD2cO2aMB8ykdkfN970rUiWQhtakMi4KaXvzfbcxkcE5UmT3lZJe84VT9hxhs3WkOQ5nmVkaeOhYh00dPBFjQ4d";
const DEFAULT_GOOGLE_MERCHANT_ID = "0225-1603-6390";

class GooglePayService {
  constructor() {
    this.stripePk = localStorage.getItem("barpilot_stripe_pk") || DEFAULT_STRIPE_LIVE_PK;
    this.merchantId = localStorage.getItem("barpilot_gpay_merchant_id") || DEFAULT_GOOGLE_MERCHANT_ID;
    this.merchantName = localStorage.getItem("barpilot_gpay_merchant_name") || "BarPilot";
    this.environment = localStorage.getItem("barpilot_gpay_env") || "PRODUCTION";
    this.paymentsClient = null;
    this.isReady = false;
    this.init();
  }

  init() {
    try {
      if (window.google && window.google.payments && window.google.payments.api) {
        this.paymentsClient = new google.payments.api.PaymentsClient({
          environment: this.environment,
          merchantInfo: {
            merchantId: this.merchantId,
            merchantName: this.merchantName
          }
        });
        this.checkIsReadyToPay();
      } else {
        console.log("[GooglePay] Google Pay SDK not yet available, will initialize on load");
      }
    } catch (e) {
      console.warn("[GooglePay] Init warning:", e);
    }
  }

  getBaseCardPaymentMethod() {
    return {
      type: 'CARD',
      parameters: {
        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
        allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA'],
        billingAddressRequired: true,
        billingAddressParameters: {
          format: 'MIN'
        }
      }
    };
  }

  getTokenizationSpecification() {
    return {
      type: 'PAYMENT_GATEWAY',
      parameters: {
        gateway: 'stripe',
        'stripe:version': '2020-08-27',
        'stripe:publishableKey': this.stripePk
      }
    };
  }

  getCardPaymentMethod() {
    return Object.assign({}, this.getBaseCardPaymentMethod(), {
      tokenizationSpecification: this.getTokenizationSpecification()
    });
  }

  checkIsReadyToPay() {
    if (!this.paymentsClient) return Promise.resolve(false);
    const isReadyToPayRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [this.getBaseCardPaymentMethod()]
    };

    return this.paymentsClient.isReadyToPay(isReadyToPayRequest)
      .then((response) => {
        this.isReady = !!(response && response.result);
        console.log("[GooglePay] isReadyToPay result:", this.isReady);
        return this.isReady;
      })
      .catch((err) => {
        console.warn("[GooglePay] isReadyToPay check note:", err);
        this.isReady = false;
        return false;
      });
  }

  // Primary payment execution method (invoked by "S'abonner" / "Abbonati con Google Play Pay")
  processGooglePayment(amount = 59.00, currency = "EUR") {
    const isFr = window.i18n ? window.i18n.currentLang === "fr" : false;

    // 1. If Google Pay SDK is loaded on user's browser, invoke official Google Pay sheet
    if (this.paymentsClient) {
      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [this.getCardPaymentMethod()],
        merchantInfo: {
          merchantId: this.merchantId,
          merchantName: this.merchantName
        },
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: Number(amount).toFixed(2),
          currencyCode: currency,
          countryCode: 'IT'
        }
      };

      console.log("[GooglePay] Launching real Google Pay Sheet with Stripe Gateway & Merchant ID:", this.merchantId);

      return this.paymentsClient.loadPaymentData(paymentDataRequest)
        .then((paymentData) => {
          console.log("[GooglePay] Payment Authorized by user:", paymentData);
          const tokenData = paymentData.paymentMethodData?.tokenizationData?.token;
          
          // Save payment confirmation
          if (window.activateSubscription) {
            window.activateSubscription("google_pay");
          }

          if (window.showToast) {
            window.showToast(isFr
              ? "🎉 Paiement Google Pay validé avec succès ! Votre abonnement est actif."
              : "🎉 Pagamento Google Pay completato con successo! Il tuo abbonamento è attivo.");
          }
          return { success: true, paymentData };
        })
        .catch((err) => {
          console.warn("[GooglePay] Google Pay UI sheet cancelled or failed:", err);
          if (err.statusCode === "CANCELED") {
            if (window.showToast) {
              window.showToast(isFr ? "Paiement Google Pay annulé" : "Pagamento Google Pay annullato");
            }
          } else {
            // Fallback to interactive in-app sheet if popup was blocked or needs user confirmation
            this.fallbackToInteractiveModal(amount);
          }
          return { success: false, error: err };
        });
    }

    // 2. Fallback if offline or SDK script blocked: use native in-app confirmation modal
    this.fallbackToInteractiveModal(amount);
    return Promise.resolve({ success: true, mode: "modal" });
  }

  fallbackToInteractiveModal(amount) {
    if (typeof window.openGooglePlayModal === "function") {
      window.openGooglePlayModal();
    }
  }

  saveSettings(stripePk, merchantId, env = "PRODUCTION") {
    if (stripePk) {
      this.stripePk = stripePk.trim();
      localStorage.setItem("barpilot_stripe_pk", this.stripePk);
    }
    if (merchantId) {
      this.merchantId = merchantId.trim();
      localStorage.setItem("barpilot_gpay_merchant_id", this.merchantId);
    }
    if (env) {
      this.environment = env;
      localStorage.setItem("barpilot_gpay_env", this.environment);
    }

    this.init();
    if (window.showToast) {
      window.showToast(window.i18n?.currentLang === "fr"
        ? "✅ Configuration Google Pay & Stripe enregistrée avec succès !"
        : "✅ Configurazione Google Pay & Stripe salvata con successo!");
    }
  }
}

// Global instance & window hook
window.googlePayService = new GooglePayService();

// Callback when Google Pay script finishes loading
window.onGooglePayLoaded = function() {
  console.log("[GooglePay] Official pay.js loaded");
  if (window.googlePayService) {
    window.googlePayService.init();
  }
};
