# Payload CMS Ahasend Email Adapter

A custom email adapter for Payload CMS that integrates with the Ahasend email service API.

## Features

- Easy integration with Payload CMS
- Support for HTML and plain text emails
- File attachments support
- Custom headers
- Reply-to functionality
- Comprehensive error handling
- TypeScript support
- Compatible with Next.js 14+ and Payload CMS 3+

## Requirements

- Node.js 18.20.2 or Node.js 20.9.0+
- Payload CMS 3.0.0+
- Next.js 14.0.0+ (if using with Next.js)
- React 18.2.0+

## Installation

```bash
npm install payload-email-ahasend
# or
yarn add payload-email-ahasend
# or
pnpm add payload-email-ahasend
```

## Usage

1. Import the adapter in your Payload config:

```typescript
import { ahasendAdapter } from 'payload-email-ahasend';
import { buildConfig } from 'payload/config';

export default buildConfig({
  // ... other config options
  email: ahasendAdapter({
    apiKey: 'your-ahasend-api-key',
    defaultFromAddress: 'noreply@yourdomain.com',
    defaultFromName: 'Your Company Name'
  }),
});
```

2. Configure your environment variables:

```env
AHASEND_API_KEY=your-api-key-here
```

## Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `apiKey` | `string` | Your Ahasend API key |
| `defaultFromAddress` | `string` | Default sender email address |
| `defaultFromName` | `string` | Default sender name |

## Email Features

The adapter supports:

- HTML and plain text email content
- File attachments
- Custom headers
- Reply-to addresses
- Multiple recipients
- Named recipients (e.g., "John Doe <john@example.com>")

## Error Handling

The adapter provides detailed error information including:
- API response status
- Failed recipients
- Success/failure counts
- Detailed error messages

## TypeScript Support

The package includes full TypeScript definitions and interfaces for type safety.

## Version Compatibility

| Version | Payload CMS | Next.js | Notes |
|---------|------------|---------|-------|
| 1.0.5+  | 3.0.0+     | 14.0.0+ | Current version with expanded framework support |
| 1.0.4   | 3.25.0     | Any     | Legacy version |

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
