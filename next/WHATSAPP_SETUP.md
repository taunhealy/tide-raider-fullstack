# WhatsApp Notifications Setup Guide

This guide explains how to set up WhatsApp notifications for alerts using MessageBird.

## Prerequisites

1. **MessageBird Account**: Sign up at [MessageBird](https://www.messagebird.com/)
2. **WhatsApp Business Account**: You'll need to set up a WhatsApp Business account through MessageBird
3. **Environment Variables**: Configure the following in your `.env` file

## Required Environment Variables

Add these to your `.env.local` or `.env` file:

```env
# MessageBird API Configuration
MESSAGEBIRD_API_KEY=your_access_key_here
MESSAGEBIRD_WORKSPACE_ID=your_workspace_id_here
MESSAGEBIRD_CHANNEL_ID=your_channel_id_here

# Optional: For template messages (first-time contacts)
MESSAGEBIRD_PROJECT_ID=your_project_id_here
```

## How to Get Your Credentials

### 1. API Key (Access Key)
1. Log in to [MessageBird Dashboard](https://dashboard.messagebird.com/)
2. Go to **Settings** → **API access**
3. Create a new API key or use an existing one
4. Copy the **Access Key** (starts with `live_` or `test_`)

### 2. Workspace ID
1. In MessageBird Dashboard, go to **Workspaces**
2. Select your workspace
3. Copy the **Workspace ID** from the URL or workspace settings

### 3. Channel ID
1. In MessageBird Dashboard, go to **Channels**
2. Find your WhatsApp channel
3. Copy the **Channel ID**

### 4. Project ID (Optional - for templates)
1. In MessageBird Dashboard, go to **Templates** or **Projects**
2. Find your WhatsApp template project
3. Copy the **Project ID**

## WhatsApp Business API Requirements

### Important Notes:

1. **24-Hour Window**: 
   - After a user sends you a message, you can send them free-form messages for 24 hours
   - Outside this window, you must use pre-approved templates

2. **Template Messages**:
   - Required for first-time contacts
   - Must be approved by WhatsApp
   - Can include variables for personalization

3. **Phone Number Format**:
   - Must be in E.164 format: `+[country code][number]`
   - Example: `+1234567890` (US), `+447911123456` (UK)

## Current Implementation

The system currently supports:

- ✅ **Direct Messages**: For ongoing conversations (within 24-hour window)
- ✅ **Template Messages**: For first-time contacts (if template ID is provided)
- ✅ **Error Handling**: Comprehensive error messages for debugging
- ✅ **Phone Number Normalization**: Automatically adds `+` prefix if missing

## Testing

### Test Endpoint

You can test WhatsApp notifications using the test alert endpoint:

```bash
# Test alert for current user
GET /api/test-alert

# Force send notification (bypasses duplicate check)
GET /api/test-alert-force?alertId=your-alert-id
```

### Manual Testing

1. Create an alert with notification method set to "whatsapp" or "both"
2. Ensure `contactInfo` contains a valid phone number in E.164 format
3. Wait for the cron job to run, or trigger manually via test endpoint

## Troubleshooting

### Common Issues

1. **"Template required" error**:
   - This means you're trying to message a contact outside the 24-hour window
   - Solution: Use a template message or wait for user to message you first

2. **"Invalid phone number" error**:
   - Check that the phone number is in E.164 format
   - Ensure country code is included

3. **"401 Unauthorized" error**:
   - Check that `MESSAGEBIRD_API_KEY` is correct
   - Ensure the API key has WhatsApp permissions

4. **"404 Not Found" error**:
   - Verify `MESSAGEBIRD_WORKSPACE_ID` and `MESSAGEBIRD_CHANNEL_ID` are correct
   - Ensure the channel is active in MessageBird dashboard

## Future Improvements

Consider implementing:

1. **Template Management**: UI to manage WhatsApp templates
2. **Conversation Tracking**: Track 24-hour windows per contact
3. **Fallback to Email**: If WhatsApp fails, automatically send email
4. **Delivery Status**: Track message delivery and read receipts
5. **Two-Way Communication**: Allow users to reply to alerts via WhatsApp

## Support

For MessageBird-specific issues, refer to:
- [MessageBird WhatsApp Documentation](https://developers.messagebird.com/api/conversations/)
- [MessageBird Support](https://support.messagebird.com/)

