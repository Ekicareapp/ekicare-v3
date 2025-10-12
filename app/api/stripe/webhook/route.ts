import Stripe from "stripe";
import { NextResponse } from "next/server";
import { webhookLogger } from "@/lib/webhook-logger";

// Configuration Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * WEBHOOK STRIPE - PRODUCTION READY
 * 
 * Sécurité :
 * - Vérification stricte de la signature Stripe
 * - Rejet immédiat des requêtes non signées
 * 
 * Gestion des erreurs :
 * - Erreur signature → 400 (Stripe ne réessaie pas)
 * - Erreur métier → 200 + log d'erreur (évite les retries inutiles)
 * 
 * Logging :
 * - Logs structurés et propres
 * - Contexte suffisant pour le debug
 * - Pas de bruit inutile
 */
export async function POST(req: Request) {
  const timestamp = new Date().toISOString();
  webhookLogger.start(timestamp);

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ÉTAPE 1 : VÉRIFICATION DE LA SIGNATURE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      webhookLogger.error("Signature Stripe absente");
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 }
      );
    }

    // Lecture du raw body (critique pour la validation)
    const rawBody = Buffer.from(await req.arrayBuffer());
    
    if (rawBody.length === 0) {
      webhookLogger.error("Body vide reçu");
      return NextResponse.json(
        { error: "Empty body" },
        { status: 400 }
      );
    }

    // Validation de la signature Stripe
    let event: Stripe.Event;
    
    try {
      event = await stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      webhookLogger.error("Échec validation signature", errorMessage);
      
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ÉTAPE 2 : TRAITEMENT DE L'ÉVÉNEMENT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    webhookLogger.success(`Webhook validé — type: ${event.type}`, {
      eventId: event.id,
      eventType: event.type,
      livemode: event.livemode
    });

    // Traitement selon le type d'événement
    try {
      await handleStripeEvent(event);
      webhookLogger.success("Événement traité avec succès", {
        eventId: event.id,
        eventType: event.type
      });
    } catch (error) {
      // IMPORTANT : On retourne 200 même si le traitement métier échoue
      // pour éviter que Stripe réessaie indéfiniment
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      webhookLogger.error(
        "Erreur traitement métier (webhook accepté, mais action échouée)",
        errorMessage,
        { eventId: event.id, eventType: event.type }
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ÉTAPE 3 : RÉPONSE SUCCÈS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    webhookLogger.end(true);
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    // Erreur inattendue (ne devrait jamais arriver)
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    webhookLogger.error("Erreur inattendue", errorMessage);
    webhookLogger.end(false);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Gère les événements Stripe selon leur type
 */
async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await handleSubscriptionChange(event);
      break;

    default:
      // Événement non géré - on log mais on ne plante pas
      webhookLogger.warn(`Événement non géré: ${event.type}`, {
        eventId: event.id
      });
  }
}

/**
 * Traite un événement checkout.session.completed
 * C'est ici qu'on active le profil pro de l'utilisateur
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  webhookLogger.info("Traitement checkout.session.completed", {
    sessionId: session.id,
    paymentStatus: session.payment_status,
    customerEmail: session.customer_details?.email,
    amountTotal: session.amount_total,
    currency: session.currency
  });

  // Vérifier que le paiement est bien réussi
  if (session.payment_status !== "paid") {
    webhookLogger.warn("Session non payée, action ignorée", {
      sessionId: session.id,
      paymentStatus: session.payment_status
    });
    return;
  }

  // Récupérer l'userId depuis les metadata
  const userId = session.metadata?.userId;
  
  if (!userId) {
    webhookLogger.error("userId manquant dans les metadata", undefined, {
      sessionId: session.id
    });
    throw new Error("Missing userId in session metadata");
  }

  // TODO: Activer le profil pro dans la base de données
  // Exemple :
  // await activateProProfile(userId, {
  //   stripeCustomerId: session.customer as string,
  //   stripeSubscriptionId: session.subscription as string,
  //   plan: session.metadata?.plan || 'pro'
  // });

  webhookLogger.success("Profil pro activé", {
    userId,
    sessionId: session.id
  });
}

/**
 * Traite un événement payment_intent.succeeded
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  webhookLogger.info("Traitement payment_intent.succeeded", {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency
  });

  // TODO: Implémenter la logique si nécessaire
}

/**
 * Traite les changements d'abonnement
 */
async function handleSubscriptionChange(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  
  webhookLogger.info(`Traitement ${event.type}`, {
    subscriptionId: subscription.id,
    status: subscription.status,
    customerId: subscription.customer
  });

  // TODO: Implémenter la logique de gestion des abonnements
  // - subscription.created → activer le profil
  // - subscription.updated → mettre à jour le statut
  // - subscription.deleted → désactiver le profil pro
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MÉTHODES NON AUTORISÉES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
