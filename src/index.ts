import type { EmailAdapter, SendEmailOptions } from 'payload'

import { APIError } from 'payload'

/**
 * Configuration options for the Ahasend email adapter
 * @interface AhasendAdapterConfig
 * @property {string} apiKey - API key for Ahasend service authentication
 * @property {string} defaultFromAddress - Default sender email address
 * @property {string} defaultFromName - Default sender name
 */
export interface AhasendAdapterConfig {
  apiKey: string
  defaultFromAddress: string
  defaultFromName: string
}

/**
 * Email recipient structure for Ahasend API
 * @interface EmailRecipient
 * @property {string} email - Email address of the recipient
 * @property {string} [name] - Optional name of the recipient
 */
interface EmailRecipient {
  email: string
  name?: string
}

/**
 * Response types from Ahasend API
 * @typedef {AhasendError | AhasendSuccess} AhasendResponse
 */
type AhasendResponse = AhasendError | AhasendSuccess

/**
 * Error response structure from Ahasend API
 * @interface AhasendError
 * @property {string} status - Error status message
 */
export interface AhasendError {
  status: string
}

/**
 * Success response structure from Ahasend API
 * @interface AhasendSuccess
 * @property {string[]} errors - Array of error messages if any
 * @property {number} fail_count - Number of failed deliveries
 * @property {string[]} failed_recipients - List of recipients that failed
 * @property {number} success_count - Number of successful deliveries
 */
export interface AhasendSuccess {
  errors: string[]
  fail_count: number
  failed_recipients: string[]
  success_count: number
}

/**
 * Ahasend-specific email structure
 * @interface AhasendEmail
 * @property {object} content - Email content information
 * @property {AhasendAttachment[]} [content.attachments] - Optional file attachments
 * @property {Record<string, string>} [content.headers] - Optional email headers
 * @property {string} [content.html_body] - Optional HTML content
 * @property {EmailRecipient} [content.reply_to] - Optional reply-to recipient
 * @property {string} content.subject - Email subject
 * @property {string} [content.text_body] - Optional plain text content
 * @property {EmailRecipient} from - Sender information
 * @property {EmailRecipient[]} recipients - List of recipients
 */
interface AhasendEmail {
  content: {
    attachments?: AhasendAttachment[]
    headers?: Record<string, string>
    html_body?: string
    reply_to?: EmailRecipient
    subject: string
    text_body?: string
  }
  from: EmailRecipient
  recipients: EmailRecipient[]
}

/**
 * Attachment structure for Ahasend API
 * @interface AhasendAttachment
 * @property {boolean} base64 - Indicates if the content is base64 encoded
 * @property {string} [content_id] - Optional content ID for referencing in HTML
 * @property {string} content_type - MIME type of the attachment
 * @property {string} data - The attachment data (base64 encoded)
 * @property {string} file_name - Name of the attachment file
 */
interface AhasendAttachment {
  base64: boolean
  content_id?: string
  content_type: string
  data: string
  file_name: string
}

/**
 * Email Parser utility for handling various email formats
 * @class EmailParser
 */
class EmailParser {
  /**
   * Parses an email string in format "Name <email@example.com>" or just "email@example.com"
   * @static
   * @param {string} emailStr - The email string to parse
   * @returns {EmailRecipient} - Parsed email recipient object
   */
  static parseEmailString(emailStr: string): EmailRecipient {
    // Optimize the regex to be more precise and handle more cases
    const match = emailStr.match(/^(?:([^<]+)<([^>]+)>|([^<\s]+))$/)

    if (match) {
      const [, name, emailInBrackets, emailWithoutBrackets] = match

      if (emailInBrackets) {
        return {
          name: name?.trim(),
          email: emailInBrackets.trim(),
        }
      }

      return { email: emailWithoutBrackets?.trim() || emailStr.trim() }
    }

    // Fallback to ensure we always return a valid structure
    return { email: emailStr.trim() }
  }
}

/**
 * Email Builder using the builder pattern
 * @class AhasendEmailBuilder
 */
class AhasendEmailBuilder {
  private email: AhasendEmail

  /**
   * Creates an instance of AhasendEmailBuilder
   * @param {AhasendAdapterConfig} config - Configuration for the email defaults
   */
  constructor(config: AhasendAdapterConfig) {
    this.email = {
      content: {
        subject: '',
      },
      from: {
        name: config.defaultFromName,
        email: config.defaultFromAddress,
      },
      recipients: [],
    }
  }

  /**
   * Builds and validates the final email object
   * @returns {AhasendEmail} - The complete email object ready to send
   * @throws {APIError} - If no recipients are defined
   */
  build(): AhasendEmail {
    if (!this.email.recipients.length) {
      throw new APIError('Email must have at least one recipient', 400)
    }

    return this.email
  }

  /**
   * Sets the attachments for the email
   * @param {SendEmailOptions["attachments"]} attachments - Array of attachments
   * @returns {this} - Returns this instance for method chaining
   * @throws {APIError} - If attachment is missing required properties
   */
  setAttachments(attachments: SendEmailOptions['attachments']): this {
    if (!attachments?.length) {
      return this
    }

    this.email.content.attachments = attachments.map(
      (attachment: NonNullable<SendEmailOptions['attachments']>[number]) => {
        if (!attachment.filename || !attachment.content) {
          throw new APIError('Attachment is missing filename or content', 400)
        }

        let data: string

        // Optimize data handling with clearer logic
        if (Buffer.isBuffer(attachment.content)) {
          data = attachment.content.toString('base64')
        } else if (typeof attachment.content === 'string') {
          // Check if it's already a base64 data URI
          if (attachment.content.startsWith('data:')) {
            const parts = attachment.content.split(',')
            data = parts[1] || ''
          } else {
            // Convert string to base64
            data = Buffer.from(attachment.content).toString('base64')
          }
        } else {
          throw new APIError('Attachment content must be a string or Buffer', 400)
        }

        return {
          base64: true,
          content_type: attachment.contentType || 'application/octet-stream',
          data,
          file_name: attachment.filename,
        }
      },
    )

    return this
  }

  /**
   * Sets the email content (subject, HTML, and plain text)
   * @param {SendEmailOptions} message - Email content options
   * @returns {this} - Returns this instance for method chaining
   */
  setContent(message: SendEmailOptions): this {
    this.email.content.subject = message.subject || ''

    // Only set body properties if they exist
    if (message.html) {
      this.email.content.html_body = String(message.html)
    }

    if (message.text) {
      this.email.content.text_body = String(message.text)
    }

    return this
  }

  /**
   * Sets the from field for the email
   * @param {SendEmailOptions["from"]} from - From address
   * @param {string} defaultFromAddress - Default sender address
   * @param {string} defaultFromName - Default sender name
   * @returns {this} - Returns this instance for method chaining
   */
  setFrom(
    from: SendEmailOptions['from'],
    defaultFromAddress: string,
    defaultFromName: string,
  ): this {
    if (!from) {
      return this
    }

    if (typeof from === 'string') {
      const parsed = EmailParser.parseEmailString(from)
      this.email.from = {
        name: parsed.name || defaultFromName,
        email: parsed.email || defaultFromAddress,
      }
    } else {
      this.email.from = {
        name: from.name || defaultFromName,
        email: from.address || defaultFromAddress,
      }
    }

    return this
  }

  /**
   * Sets the recipients for the email
   * @param {SendEmailOptions["to"]} addresses - Recipient addresses
   * @returns {this} - Returns this instance for method chaining
   */
  setRecipients(addresses: SendEmailOptions['to']): this {
    if (!addresses) {
      return this
    }

    const recipients: EmailRecipient[] = []

    if (typeof addresses === 'string') {
      recipients.push(EmailParser.parseEmailString(addresses))
    } else if (Array.isArray(addresses)) {
      addresses.forEach((address) => {
        if (typeof address === 'string') {
          recipients.push(EmailParser.parseEmailString(address))
        } else if (address?.address) {
          recipients.push({
            name: address.name,
            email: address.address,
          })
        }
      })
    } else if (addresses?.address) {
      recipients.push({
        name: addresses.name,
        email: addresses.address,
      })
    }

    this.email.recipients = recipients
    return this
  }

  /**
   * Sets the reply-to field for the email
   * @param {SendEmailOptions["replyTo"]} replyTo - Reply-to address
   * @returns {this} - Returns this instance for method chaining
   */
  setReplyTo(replyTo: SendEmailOptions['replyTo']): this {
    if (!replyTo) {
      return this
    }

    if (typeof replyTo === 'string') {
      this.email.content.reply_to = EmailParser.parseEmailString(replyTo)
    } else if (Array.isArray(replyTo) && replyTo.length > 0) {
      const first = replyTo[0]
      if (typeof first === 'string') {
        this.email.content.reply_to = EmailParser.parseEmailString(first)
      } else if (first?.address) {
        this.email.content.reply_to = {
          name: first.name,
          email: first.address,
        }
      }
    } else if (!Array.isArray(replyTo) && replyTo?.address) {
      this.email.content.reply_to = {
        name: replyTo.name,
        email: replyTo.address,
      }
    }

    return this
  }
}

/**
 * Service class for sending emails via Ahasend API
 * @class AhasendEmailService
 */
class AhasendEmailService {
  private apiKey: string

  /**
   * Creates an instance of AhasendEmailService
   * @param {string} apiKey - API key for Ahasend service
   */
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Sends an email using the Ahasend API
   * @param {AhasendEmail} emailOptions - Email to send
   * @returns {Promise<AhasendResponse>} - API response
   * @throws {APIError} - If the API request fails
   */
  async sendEmail(emailOptions: AhasendEmail): Promise<AhasendResponse> {
    try {
      const response = await fetch('https://api.ahasend.com/v1/email/send', {
        body: JSON.stringify(emailOptions),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey,
        },
        method: 'POST',
      })

      if (!response.ok) {
        throw new APIError(`API request failed with status ${response.status}`, response.status)
      }

      const data = (await response.json()) as AhasendResponse

      if ('success_count' in data) {
        return data
      } else {
        throw new APIError(data.status || 'Unknown error', response.status)
      }
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new APIError(`Failed to send email: ${(error as Error).message}`, 500)
    }
  }
}

/**
 * Creates an Ahasend email adapter for Payload CMS
 * @function ahasendAdapter
 * @param {AhasendAdapterConfig} config - Configuration for the adapter
 * @returns {EmailAdapter<AhasendResponse>} - Configured email adapter
 * @example
 * // Create and configure the adapter
 * const emailAdapter = ahasendAdapter({
 *   apiKey: 'your-ahasend-api-key',
 *   defaultFromAddress: 'noreply@example.com',
 *   defaultFromName: 'Example Company'
 * });
 *
 * // Use in Payload config
 * export const config = {
 *   email: emailAdapter(),
 *   // rest of Payload config
 * };
 */
export const ahasendAdapter = (config: AhasendAdapterConfig): EmailAdapter<AhasendResponse> => {
  const { apiKey, defaultFromAddress, defaultFromName } = config
  const emailService = new AhasendEmailService(apiKey)

  return () => ({
    name: 'ahasend-rest',
    defaultFromAddress,
    defaultFromName,
    sendEmail: async (message: SendEmailOptions) => {
      try {
        const emailBuilder = new AhasendEmailBuilder(config)
          .setFrom(message.from, defaultFromAddress, defaultFromName)
          .setRecipients(message.to)
          .setReplyTo(message.replyTo)
          .setContent(message)
          .setAttachments(message.attachments)

        const emailOptions = emailBuilder.build()
        return await emailService.sendEmail(emailOptions)
      } catch (error) {
        if (error instanceof APIError) {
          throw error
        }
        throw new APIError(`Failed to send email: ${(error as Error).message}`, 500)
      }
    },
  })
}
