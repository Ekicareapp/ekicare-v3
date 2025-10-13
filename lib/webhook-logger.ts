/**
 * WEBHOOK LOGGER - Système de logging structuré pour webhooks
 * 
 * Fournit des fonctions de logging propres et consistantes
 * pour faciliter le debug et le monitoring en production
 */

type LogLevel = 'info' | 'success' | 'error' | 'warn';

interface LogContext {
  eventId?: string;
  eventType?: string;
  [key: string]: any;
}

class WebhookLogger {
  private prefix = '[WEBHOOK]';

  /**
   * Log un message d'information
   */
  info(message: string, context?: LogContext) {
    console.log(`${this.prefix} ${message}`, context ? JSON.stringify(context) : '');
  }

  /**
   * Log un succès
   */
  success(message: string, context?: LogContext) {
    console.log(`${this.prefix} ✅ ${message}`, context ? JSON.stringify(context) : '');
  }

  /**
   * Log une erreur
   */
  error(message: string, error?: Error | string, context?: LogContext) {
    const errorMessage = error instanceof Error ? error.message : error;
    console.error(`${this.prefix} ❌ ${message}`, errorMessage || '', context ? JSON.stringify(context) : '');
  }

  /**
   * Log un avertissement
   */
  warn(message: string, context?: LogContext) {
    console.warn(`${this.prefix} ⚠️  ${message}`, context ? JSON.stringify(context) : '');
  }

  /**
   * Log de démarrage de traitement webhook
   */
  start(timestamp: string) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`${this.prefix} Webhook reçu - ${timestamp}`);
  }

  /**
   * Log de fin de traitement webhook
   */
  end(success: boolean) {
    console.log(`${this.prefix} ${success ? '✅' : '❌'} Traitement ${success ? 'réussi' : 'échoué'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

export const webhookLogger = new WebhookLogger();


