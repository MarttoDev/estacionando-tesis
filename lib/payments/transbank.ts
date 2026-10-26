import crypto from 'node:crypto'
import { Environment, IntegrationApiKeys, IntegrationCommerceCodes, Options, WebpayPlus } from 'transbank-sdk'

/**
 * Defaults to Transbank's publicly documented Integration (sandbox) commerce code and API key —
 * the same constants the SDK ships under IntegrationCommerceCodes/IntegrationApiKeys. Safe to
 * commit: it only works against Transbank's test environment. Set the three TRANSBANK_* env vars
 * to point this at Production once the business has a real commerce code.
 */
function buildTransaction() {
  const commerceCode = process.env.TRANSBANK_COMMERCE_CODE || IntegrationCommerceCodes.WEBPAY_PLUS
  const apiKey = process.env.TRANSBANK_API_KEY || IntegrationApiKeys.WEBPAY
  const environment = process.env.TRANSBANK_ENV === 'production' ? Environment.Production : Environment.Integration
  return new WebpayPlus.Transaction(new Options(commerceCode, apiKey, environment))
}

/** Transbank buy orders must be unique and ≤26 chars — reservation UUIDs are too long to use directly. */
export function generateBuyOrder() {
  return crypto.randomBytes(10).toString('hex')
}

export async function createWebpayTransaction(params: { buyOrder: string; sessionId: string; amount: number; returnUrl: string }) {
  const transaction = buildTransaction()
  return transaction.create(params.buyOrder, params.sessionId, params.amount, params.returnUrl)
}

export async function commitWebpayTransaction(token: string) {
  const transaction = buildTransaction()
  return transaction.commit(token)
}

export async function refundWebpayTransaction(token: string, amount: number) {
  const transaction = buildTransaction()
  return transaction.refund(token, amount)
}
