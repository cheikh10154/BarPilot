// ==========================================================================
// BarPilot - Real Stripe Card Verification & Gateway Service
// ==========================================================================

const STRIPE_LIVE_PK = "pk_live_51RpuNaPFZ2dvD2cO2aMB8ykdkfN970rUiWQhtakMi4KaXvzfbcxkcE5UmT3lZJe84VT9hxhs3WkOQ5nmVkaeOhYh00dPBFjQ4d";

function mapStripeErrorMessage(errCode, defaultMsg) {
  const isFr = window.i18n ? window.i18n.currentLang === "fr" : false;
  const errorMapIt = {
    incorrect_number: "Il numero di carta inserito non è valido.",
    invalid_number: "Il numero di carta inserito non è corretto.",
    invalid_expiry_month: "Il mese di scadenza non è valido.",
    invalid_expiry_year: "L'anno di scadenza non è valido.",
    invalid_cvc: "Il codice di sicurezza (CVC) non è corretto.",
    expired_card: "La carta inserita risulta scaduta.",
    card_declined: "La carta è stata rifiutata dal circuito bancario. Verifica il credito o contatta la banca.",
    processing_error: "Si è verificato un errore durante l'elaborazione del pagamento. Riprova più tardi.",
    insufficient_funds: "Fondi insufficienti sulla carta.",
    lost_card: "La carta inserita risulta segnalata come smarrita.",
    stolen_card: "La carta inserita risulta segnalata come rubata.",
    card_velocity_exceeded: "Limite di transazioni raggiunto per questa carta. Riprova più tardi."
  };

  const errorMapFr = {
    incorrect_number: "Le numéro de carte n'est pas valide.",
    invalid_number: "Le numéro de carte est incorrect.",
    invalid_expiry_month: "Le mois d'expiration n'est pas valide.",
    invalid_expiry_year: "L'année d'expiration n'est pas valide.",
    invalid_cvc: "Le code de sécurité (CVC) est incorrect.",
    expired_card: "La carte bancaire est expirée.",
    card_declined: "La carte a été refusée par la banque.",
    processing_error: "Une erreur est survenue lors du traitement. Veuillez réessayer.",
    insufficient_funds: "Fonds insuffisants sur la carte.",
    lost_card: "La carte est signalée comme perdue.",
    stolen_card: "La carte est signalée comme volée."
  };

  const map = isFr ? errorMapFr : errorMapIt;
  if (errCode && map[errCode]) {
    return map[errCode];
  }
  return defaultMsg || (isFr ? "Carte refusée ou informations invalides." : "Carta rifiutata o dati non validi.");
}

async function verifyCardWithStripe(cardData) {
  const pk = localStorage.getItem("barpilot_stripe_pk") || STRIPE_LIVE_PK;

  const number = (cardData.number || "").replace(/\s+/g, "");
  const expMonth = parseInt(cardData.exp_month, 10);
  let expYear = parseInt(cardData.exp_year, 10);
  if (expYear < 100) expYear += 2000;
  const cvc = (cardData.cvc || "").trim();
  const name = (cardData.name || "").trim();

  // 1. First method: Stripe.js SDK if loaded
  if (window.Stripe) {
    try {
      const stripeInstance = window.Stripe(pk, { locale: (window.i18n?.currentLang === "fr" ? "fr" : "it") });
      if (stripeInstance && typeof stripeInstance.createToken === "function") {
        console.log("[StripeService] Calling Stripe.js createToken...");
        const res = await stripeInstance.createToken("card", {
          number: number,
          exp_month: expMonth,
          exp_year: expYear,
          cvc: cvc,
          name: name
        });

        if (res && res.error) {
          const userMsg = mapStripeErrorMessage(res.error.code, res.error.message);
          return {
            success: false,
            error: userMsg,
            rawError: res.error
          };
        }

        if (res && res.token) {
          return {
            success: true,
            token: res.token,
            brand: res.token.card?.brand || "Carta",
            last4: res.token.card?.last4 || number.slice(-4),
            tokenId: res.token.id
          };
        }
      }
    } catch (sdkErr) {
      console.warn("[StripeService] Stripe.js createToken exception, falling back to REST API:", sdkErr);
    }
  }

  // 2. Fallback method: Direct HTTPS request to Stripe Tokens API
  try {
    console.log("[StripeService] Calling Stripe REST API directly...");
    const bodyParams = new URLSearchParams();
    bodyParams.append("card[number]", number);
    bodyParams.append("card[exp_month]", String(expMonth));
    bodyParams.append("card[exp_year]", String(expYear));
    bodyParams.append("card[cvc]", cvc);
    if (name) {
      bodyParams.append("card[name]", name);
    }

    const response = await fetch("https://api.stripe.com/v1/tokens", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + pk,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: bodyParams.toString()
    });

    const data = await response.json();

    if (response.ok && data && data.id) {
      return {
        success: true,
        token: data,
        brand: data.card?.brand || "Carta",
        last4: data.card?.last4 || number.slice(-4),
        tokenId: data.id
      };
    } else {
      const errObj = data?.error || {};
      const userMsg = mapStripeErrorMessage(errObj.code, errObj.message);
      return {
        success: false,
        error: userMsg,
        rawError: errObj
      };
    }
  } catch (netErr) {
    console.error("[StripeService] Network error connecting to Stripe API:", netErr);
    return {
      success: false,
      error: "Impossibile contattare i server di Stripe. Verifica la connessione internet e riprova."
    };
  }
}

// Global exposure
window.verifyCardWithStripe = verifyCardWithStripe;
window.stripePaymentService = {
  verifyCard: verifyCardWithStripe,
  getPublishableKey: () => STRIPE_LIVE_PK
};
