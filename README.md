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

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
