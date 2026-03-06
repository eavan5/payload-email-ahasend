import { APIError } from 'payload'

import {
    AhasendEmailBuilder,
    AhasendEmailService,
    EmailParser,
    ahasendAdapter,
    getApiEndpoint,
} from '../index.js'

import type { AhasendAdapterConfig, AhasendEmail } from '../index.js'

// ─────────────────────────────────────────
// EmailParser Tests
// ─────────────────────────────────────────

describe('EmailParser', () => {
    describe('parseEmailString', () => {
        it('parses "Name <email>" format', () => {
            const result = EmailParser.parseEmailString('John Doe <john@example.com>')
            expect(result).toEqual({ name: 'John Doe', email: 'john@example.com' })
        })

        it('parses plain email address', () => {
            const result = EmailParser.parseEmailString('john@example.com')
            expect(result).toEqual({ email: 'john@example.com' })
        })

        it('trims whitespace from name and email', () => {
            const result = EmailParser.parseEmailString('  John Doe  < john@example.com >')
            expect(result).toEqual({ name: 'John Doe', email: 'john@example.com' })
        })

        it('handles email with no name in brackets (fallback)', () => {
            const result = EmailParser.parseEmailString('<admin@test.com>')
            // The regex doesn't match bare <email> format, falls through to fallback
            expect(result).toEqual({ email: '<admin@test.com>' })
        })

        it('handles empty string gracefully', () => {
            const result = EmailParser.parseEmailString('')
            expect(result).toEqual({ email: '' })
        })

        it('handles string with spaces', () => {
            const result = EmailParser.parseEmailString('   ')
            expect(result).toEqual({ email: '' })
        })

        it('handles malformed input as fallback email', () => {
            const result = EmailParser.parseEmailString('some random text with spaces')
            // Falls through to fallback
            expect(result).toHaveProperty('email')
        })
    })
})

// ─────────────────────────────────────────
// getApiEndpoint Tests
// ─────────────────────────────────────────

describe('getApiEndpoint', () => {
    it('returns v1 endpoint by default', () => {
        expect(getApiEndpoint('v1')).toBe('https://api.ahasend.com/v1/email/send')
    })

    it('returns v2 endpoint with accountId', () => {
        expect(getApiEndpoint('v2', 'acc_123')).toBe(
            'https://api.ahasend.com/v2/accounts/acc_123/messages',
        )
    })

    it('throws if v2 without accountId', () => {
        expect(() => getApiEndpoint('v2')).toThrow()
    })
})

// ─────────────────────────────────────────
// AhasendEmailBuilder Tests
// ─────────────────────────────────────────

describe('AhasendEmailBuilder', () => {
    const defaultConfig: AhasendAdapterConfig = {
        apiKey: 'test-key',
        defaultFromAddress: 'default@example.com',
        defaultFromName: 'Default Name',
    }

    it('creates builder with default from address', () => {
        const builder = new AhasendEmailBuilder(defaultConfig)
        builder.setRecipients('to@example.com')
        const email = builder.build()

        expect(email.from).toEqual({
            name: 'Default Name',
            email: 'default@example.com',
        })
    })

    it('throws when building with no recipients', () => {
        const builder = new AhasendEmailBuilder(defaultConfig)
        expect(() => builder.build()).toThrow()
    })

    // ── setRecipients ──

    describe('setRecipients', () => {
        it('handles string recipient', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            builder.setRecipients('alice@test.com')
            const email = builder.build()
            expect(email.recipients).toEqual([{ email: 'alice@test.com' }])
        })

        it('handles array of string recipients', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            builder.setRecipients(['a@test.com', 'b@test.com'])
            const email = builder.build()
            expect(email.recipients).toHaveLength(2)
        })

        it('handles array of object recipients', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            builder.setRecipients([{ name: 'Alice', address: 'alice@test.com' }])
            const email = builder.build()
            expect(email.recipients).toEqual([{ name: 'Alice', email: 'alice@test.com' }])
        })

        it('handles single object recipient', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            builder.setRecipients({ name: 'Bob', address: 'bob@test.com' })
            const email = builder.build()
            expect(email.recipients).toEqual([{ name: 'Bob', email: 'bob@test.com' }])
        })

        it('handles named email string "Name <email>"', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            builder.setRecipients('Charlie <charlie@test.com>')
            const email = builder.build()
            expect(email.recipients).toEqual([{ name: 'Charlie', email: 'charlie@test.com' }])
        })

        it('returns this when addresses is undefined', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            const result = builder.setRecipients(undefined as any)
            expect(result).toBe(builder)
        })
    })

    // ── setFrom ──

    describe('setFrom', () => {
        it('parses string from address', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            builder
                .setFrom('Sender <sender@test.com>', defaultConfig.defaultFromAddress, defaultConfig.defaultFromName)
                .setRecipients('to@test.com')
            const email = builder.build()
            expect(email.from).toEqual({ name: 'Sender', email: 'sender@test.com' })
        })

        it('handles object from address', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            builder
                .setFrom({ name: 'From', address: 'from@test.com' }, defaultConfig.defaultFromAddress, defaultConfig.defaultFromName)
                .setRecipients('to@test.com')
            const email = builder.build()
            expect(email.from).toEqual({ name: 'From', email: 'from@test.com' })
        })

        it('uses defaults when from is undefined', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            builder
                .setFrom(undefined as any, defaultConfig.defaultFromAddress, defaultConfig.defaultFromName)
                .setRecipients('to@test.com')
            const email = builder.build()
            expect(email.from).toEqual({
                name: defaultConfig.defaultFromName,
                email: defaultConfig.defaultFromAddress,
            })
        })
    })

    // ── setContent ──

    describe('setContent', () => {
        it('sets subject, html, and text', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            builder
                .setContent({
                    subject: 'Test Subject',
                    html: '<p>Hello</p>',
                    text: 'Hello',
                    to: 'to@test.com',
                })
                .setRecipients('to@test.com')
            const email = builder.build()

            expect(email.content.subject).toBe('Test Subject')
            expect(email.content.html_body).toBe('<p>Hello</p>')
            expect(email.content.text_body).toBe('Hello')
        })

        it('handles missing subject', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            builder
                .setContent({ to: 'to@test.com' } as any)
                .setRecipients('to@test.com')
            const email = builder.build()
            expect(email.content.subject).toBe('')
        })

        it('does not set html_body if html is undefined', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            builder
                .setContent({ subject: 'Test', to: 'to@test.com' })
                .setRecipients('to@test.com')
            const email = builder.build()
            expect(email.content.html_body).toBeUndefined()
        })
    })

    // ── setAttachments ──

    describe('setAttachments', () => {
        it('handles empty attachments', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            builder.setAttachments([]).setRecipients('to@test.com')
            const email = builder.build()
            expect(email.content.attachments).toBeUndefined()
        })

        it('converts Buffer content to base64', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            builder
                .setAttachments([
                    {
                        filename: 'test.txt',
                        content: Buffer.from('hello world'),
                        contentType: 'text/plain',
                    },
                ])
                .setRecipients('to@test.com')
            const email = builder.build()

            expect(email.content.attachments).toHaveLength(1)
            expect(email.content.attachments![0]).toEqual({
                base64: true,
                content_type: 'text/plain',
                data: Buffer.from('hello world').toString('base64'),
                file_name: 'test.txt',
            })
        })

        it('converts string content to base64', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            builder
                .setAttachments([
                    {
                        filename: 'test.txt',
                        content: 'plain text',
                        contentType: 'text/plain',
                    },
                ])
                .setRecipients('to@test.com')
            const email = builder.build()

            expect(email.content.attachments![0].data).toBe(
                Buffer.from('plain text').toString('base64'),
            )
        })

        it('handles data URI string content', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            builder
                .setAttachments([
                    {
                        filename: 'image.png',
                        content: 'data:image/png;base64,iVBORw0KGgoAAAA',
                        contentType: 'image/png',
                    },
                ])
                .setRecipients('to@test.com')
            const email = builder.build()

            expect(email.content.attachments![0].data).toBe('iVBORw0KGgoAAAA')
        })

        it('uses default content type when not provided', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            builder
                .setAttachments([
                    {
                        filename: 'file.bin',
                        content: Buffer.from('data'),
                    },
                ])
                .setRecipients('to@test.com')
            const email = builder.build()

            expect(email.content.attachments![0].content_type).toBe('application/octet-stream')
        })

        it('throws if attachment is missing filename', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            expect(() =>
                builder.setAttachments([{ content: 'data' } as any]),
            ).toThrow()
        })

        it('throws if attachment is missing content', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            expect(() =>
                builder.setAttachments([{ filename: 'test.txt' } as any]),
            ).toThrow()
        })

        it('throws if attachment content is invalid type', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            expect(() =>
                builder.setAttachments([
                    { filename: 'test.txt', content: 123 as any },
                ]),
            ).toThrow()
        })
    })

    // ── setReplyTo ──

    describe('setReplyTo', () => {
        it('handles string replyTo', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            builder.setReplyTo('reply@test.com').setRecipients('to@test.com')
            const email = builder.build()
            expect(email.content.reply_to).toEqual({ email: 'reply@test.com' })
        })

        it('handles array of string replyTo (uses first)', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            builder.setReplyTo(['first@test.com', 'second@test.com']).setRecipients('to@test.com')
            const email = builder.build()
            expect(email.content.reply_to).toEqual({ email: 'first@test.com' })
        })

        it('handles array of object replyTo', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            builder
                .setReplyTo([{ name: 'Reply', address: 'reply@test.com' }])
                .setRecipients('to@test.com')
            const email = builder.build()
            expect(email.content.reply_to).toEqual({ name: 'Reply', email: 'reply@test.com' })
        })

        it('handles single object replyTo', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            builder
                .setReplyTo({ name: 'Reply', address: 'reply@test.com' })
                .setRecipients('to@test.com')
            const email = builder.build()
            expect(email.content.reply_to).toEqual({ name: 'Reply', email: 'reply@test.com' })
        })

        it('does nothing when replyTo is undefined', () => {
            const builder = new AhasendEmailBuilder(defaultConfig)
            builder.setReplyTo(undefined as any).setRecipients('to@test.com')
            const email = builder.build()
            expect(email.content.reply_to).toBeUndefined()
        })
    })
})

// ─────────────────────────────────────────
// AhasendEmailService Tests
// ─────────────────────────────────────────

describe('AhasendEmailService', () => {
    const mockEmailOptions: AhasendEmail = {
        content: {
            subject: 'Test',
            html_body: '<p>Test</p>',
        },
        from: { name: 'Sender', email: 'sender@test.com' },
        recipients: [{ email: 'to@test.com' }],
    }

    let originalFetch: typeof global.fetch

    beforeEach(() => {
        originalFetch = global.fetch
    })

    afterEach(() => {
        global.fetch = originalFetch
    })

    it('sends email via v1 endpoint', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () =>
                Promise.resolve({
                    success_count: 1,
                    fail_count: 0,
                    errors: [],
                    failed_recipients: [],
                }),
        })

        const service = new AhasendEmailService('test-key')
        const result = await service.sendEmail(mockEmailOptions)

        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.ahasend.com/v1/email/send',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'X-Api-Key': 'test-key',
                }),
            }),
        )
        expect(result).toEqual({
            success_count: 1,
            fail_count: 0,
            errors: [],
            failed_recipients: [],
        })
    })

    it('sends email via v2 endpoint', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () =>
                Promise.resolve({
                    success_count: 1,
                    fail_count: 0,
                    errors: [],
                    failed_recipients: [],
                }),
        })

        const service = new AhasendEmailService('test-key', 'v2', 'acc_123')
        await service.sendEmail(mockEmailOptions)

        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.ahasend.com/v2/accounts/acc_123/messages',
            expect.anything(),
        )
    })

    it('throws on non-ok response', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 401,
        })

        const service = new AhasendEmailService('bad-key')
        await expect(service.sendEmail(mockEmailOptions)).rejects.toThrow(
            'API request failed with status 401',
        )
    })

    it('throws on response with fail_count > 0', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () =>
                Promise.resolve({
                    success_count: 0,
                    fail_count: 1,
                    errors: ['Invalid recipient'],
                    failed_recipients: ['bad@test.com'],
                }),
        })

        const service = new AhasendEmailService('test-key')
        await expect(service.sendEmail(mockEmailOptions)).rejects.toThrow()
    })

    it('throws on error response with status field', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ status: 'Unauthorized' }),
        })

        const service = new AhasendEmailService('test-key')
        await expect(service.sendEmail(mockEmailOptions)).rejects.toThrow('Unauthorized')
    })

    it('wraps network errors', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'))

        const service = new AhasendEmailService('test-key')
        await expect(service.sendEmail(mockEmailOptions)).rejects.toThrow(
            'Failed to send email: Network failure',
        )
    })

    it('sends body as JSON', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () =>
                Promise.resolve({
                    success_count: 1,
                    fail_count: 0,
                    errors: [],
                    failed_recipients: [],
                }),
        })

        const service = new AhasendEmailService('test-key')
        await service.sendEmail(mockEmailOptions)

        const callArgs = (global.fetch as jest.Mock).mock.calls[0]
        const body = JSON.parse(callArgs[1].body)
        expect(body).toEqual(mockEmailOptions)
    })
})

// ─────────────────────────────────────────
// ahasendAdapter Factory Tests
// ─────────────────────────────────────────

describe('ahasendAdapter', () => {
    const defaultConfig: AhasendAdapterConfig = {
        apiKey: 'test-key',
        defaultFromAddress: 'default@example.com',
        defaultFromName: 'Default Sender',
    }

    let originalFetch: typeof global.fetch

    beforeEach(() => {
        originalFetch = global.fetch
    })

    afterEach(() => {
        global.fetch = originalFetch
    })

    it('returns a function', () => {
        const adapter = ahasendAdapter(defaultConfig)
        expect(typeof adapter).toBe('function')
    })

    it('adapter function returns correct structure', () => {
        const adapter = ahasendAdapter(defaultConfig)
        const result = adapter({ payload: {} as any })

        expect(result).toHaveProperty('name', 'ahasend-rest')
        expect(result).toHaveProperty('defaultFromAddress', 'default@example.com')
        expect(result).toHaveProperty('defaultFromName', 'Default Sender')
        expect(typeof result.sendEmail).toBe('function')
    })

    it('sendEmail calls the API and returns result', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () =>
                Promise.resolve({
                    success_count: 1,
                    fail_count: 0,
                    errors: [],
                    failed_recipients: [],
                }),
        })

        const adapter = ahasendAdapter(defaultConfig)
        const { sendEmail } = adapter({ payload: {} as any })

        const result = await sendEmail({
            to: 'recipient@test.com',
            subject: 'Hello',
            html: '<p>World</p>',
        })

        expect(result).toEqual({
            success_count: 1,
            fail_count: 0,
            errors: [],
            failed_recipients: [],
        })
        expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('throws when v2 is configured without accountId', () => {
        expect(() =>
            ahasendAdapter({
                ...defaultConfig,
                apiVersion: 'v2',
            }),
        ).toThrow('accountId is required')
    })

    it('v2 adapter sends to correct endpoint', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () =>
                Promise.resolve({
                    success_count: 1,
                    fail_count: 0,
                    errors: [],
                    failed_recipients: [],
                }),
        })

        const adapter = ahasendAdapter({
            ...defaultConfig,
            apiVersion: 'v2',
            accountId: 'acc_456',
        })
        const { sendEmail } = adapter({ payload: {} as any })

        await sendEmail({
            to: 'recipient@test.com',
            subject: 'Hello v2',
            html: '<p>v2</p>',
        })

        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.ahasend.com/v2/accounts/acc_456/messages',
            expect.anything(),
        )
    })

    it('sendEmail throws on no recipients', async () => {
        const adapter = ahasendAdapter(defaultConfig)
        const { sendEmail } = adapter({ payload: {} as any })

        await expect(
            sendEmail({ subject: 'No recipient' } as any),
        ).rejects.toThrow('Email must have at least one recipient')
    })

    it('sendEmail wraps unexpected errors', async () => {
        global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed'))

        const adapter = ahasendAdapter(defaultConfig)
        const { sendEmail } = adapter({ payload: {} as any })

        await expect(
            sendEmail({
                to: 'to@test.com',
                subject: 'Fail',
            }),
        ).rejects.toThrow('Failed to send email')
    })
})
