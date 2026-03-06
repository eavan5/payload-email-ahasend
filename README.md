# Payload CMS Ahasend Email Adapter

A custom email adapter for Payload CMS that integrates with the Ahasend email service API.

## Features

- Easy integration with Payload CMS
- Support for AhaSend API v1 and v2
- HTML and plain text emails
- File attachments support
- Custom headers
- Reply-to functionality
- Comprehensive error handling
- TypeScript support
- Compatible with Next.js 14+/15+/16+ and Payload CMS 3+

## Requirements

- Node.js 20.9.0+
- Payload CMS 3.0.0+
- Next.js 14.0.0+ (if using with Next.js)
- React 18.2.0+ or 19.0.0+

## Installation

```bash
npm install payload-email-ahasend
# or
yarn add payload-email-ahasend
# or
pnpm add payload-email-ahasend
```

## Usage

### API v1 (Default)

```typescript
import { ahasendAdapter } from "payload-email-ahasend";
import { buildConfig } from "payload";

export default buildConfig({
  // ... other config options
  email: ahasendAdapter({
    apiKey: "your-ahasend-api-key",
    defaultFromAddress: "noreply@yourdomain.com",
    defaultFromName: "Your Company Name",
  }),
});
```

### API v2

```typescript
import { ahasendAdapter } from "payload-email-ahasend";
import { buildConfig } from "payload";

export default buildConfig({
  // ... other config options
  email: ahasendAdapter({
    apiKey: "your-ahasend-v2-api-key",
    defaultFromAddress: "noreply@yourdomain.com",
    defaultFromName: "Your Company Name",
    apiVersion: "v2",
    accountId: "your-account-id",
  }),
});
```

### Environment Variables

```env
AHASEND_API_KEY=your-api-key-here
AHASEND_ACCOUNT_ID=your-account-id-for-v2
```

## Configuration Options

| Option               | Type           | Required | Description                          |
| -------------------- | -------------- | -------- | ------------------------------------ |
| `apiKey`             | `string`       | ✅       | Your Ahasend API key                 |
| `defaultFromAddress` | `string`       | ✅       | Default sender email address         |
| `defaultFromName`    | `string`       | ✅       | Default sender name                  |
| `apiVersion`         | `'v1' \| 'v2'` | ❌       | API version to use (default: `'v1'`) |
| `accountId`          | `string`       | v2 only  | Account ID for API v2                |

## Email Features

The adapter supports:

- HTML and plain text email content
- File attachments (Buffer, string, and data URI)
- Custom headers
- Reply-to addresses
- Multiple recipients
- Named recipients (e.g., "John Doe \<john@example.com\>")

## Error Handling

The adapter provides detailed error information including:

- API response status
- Failed recipients
- Success/failure counts
- Detailed error messages

## TypeScript Support

The package includes full TypeScript definitions and interfaces for type safety.

## Version Compatibility

| Version | Payload CMS | Next.js  | React       | Node.js  | AhaSend API |
| ------- | ----------- | -------- | ----------- | -------- | ----------- |
| 2.0.0+  | 3.0.0+      | 14/15/16 | 18.2+ / 19+ | 20.9.0+  | v1 & v2     |
| 1.0.5   | 3.0.0+      | 14/15    | 18.2+ / 19+ | 18.20.2+ | v1 only     |
| 1.0.4   | 3.25.0      | Any      | 18.2+       | 18.20.2+ | v1 only     |

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
