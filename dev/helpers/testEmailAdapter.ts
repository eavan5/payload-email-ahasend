
import { ahasendAdapter } from 'payload-email-ahasend'

/**
 * Logs all emails to stdout
 */
export const testEmailAdapter = ahasendAdapter({
  apiKey: process.env.AHASEND_API_KEY || '',
  defaultFromAddress: process.env.AHASEND_EMAIL || '',
  defaultFromName: process.env.AHASEND_NAME || '',
})