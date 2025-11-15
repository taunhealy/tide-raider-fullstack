# WaSenderAPI WhatsApp Integration Guide

WaSenderAPI is a simple, affordable WhatsApp API that doesn't require:
- ❌ Business email
- ❌ 2FA
- ❌ Meta business verification
- ❌ Complex setup

## Quick Setup

1. **Sign up at [WaSenderAPI.com](https://wasenderapi.com)**
   - Use your personal email
   - No business verification needed

2. **Get your API token**
   - After signup, you'll get an API token
   - Connect your WhatsApp via QR code (like WhatsApp Web)

3. **Add to environment variables:**
   ```env
   WASENDERAPI_TOKEN=your_api_token_here
   ```

4. **That's it!** The system will automatically use WaSenderAPI for WhatsApp notifications.

## Pricing

- **Starting at $6/month**
- Unlimited messages (according to their site)
- No per-message charges

## Features

- ✅ Send text messages
- ✅ Send media (images, videos, documents)
- ✅ Webhook support for incoming messages
- ✅ Simple REST API
- ✅ Token-based authentication

## API Documentation

WaSenderAPI uses a simple REST API:
- Base URL: `https://api.wasenderapi.com/v1`
- Authentication: Bearer token
- Simple POST requests to send messages

