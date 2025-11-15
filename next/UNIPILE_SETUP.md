# Unipile WhatsApp Setup Guide

## Is Unipile Affordable and Simple?

**Yes! Unipile is both affordable and simple:**

### ✅ **Simple:**
- QR code connection (like WhatsApp Web)
- No business email required
- No 2FA required
- No Meta business verification needed
- Quick setup (minutes, not days)

### ✅ **Affordable:**
- **7-day free trial** with all features
- **€49/month** (~$55) for up to 10 connected accounts
- **€5/month** (~$5.50) per additional account
- No upfront costs
- Transparent pricing

## Quick Setup Steps

1. **Sign up at [Unipile.com](https://unipile.com)**
   - Use your personal email ✅
   - No business verification needed ✅

2. **Get your API Key:**
   - Log into Unipile dashboard
   - Go to Settings → API Keys
   - Create a new API key
   - Copy the key

3. **Connect WhatsApp:**
   - In Unipile dashboard, go to WhatsApp
   - Click "Connect WhatsApp"
   - Scan the QR code with your phone (like WhatsApp Web)
   - Done! ✅

4. **Add to Environment Variables:**
   ```env
   UNIPILE_API_KEY=your_api_key_here
   ```

5. **That's it!** The system will automatically use Unipile for WhatsApp notifications.

## How It Works

- **QR Code Connection**: Just like connecting WhatsApp Web, you scan a QR code
- **No Business Requirements**: Works with personal WhatsApp accounts
- **Real-time Messaging**: Send and receive messages instantly
- **Media Support**: Send images, videos, documents, voice notes

## API Endpoint

The implementation uses Unipile's REST API:
- Endpoint: `https://api.unipile.com/v1/messages`
- Method: POST
- Auth: Bearer token
- Body: `{ to: "+1234567890", text: "message" }`

## Testing

Once configured, test using:
```bash
GET /api/test-alert-force?alertId=your-alert-id
```

## Support

- [Unipile Documentation](https://unipile.com/whatsapp-api-documentation)
- [Unipile Support](https://unipile.com/support)

