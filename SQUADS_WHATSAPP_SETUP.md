# Squads & WhatsApp Broadcast Feature Setup Guide

## Overview
This feature allows users to create "Squads" (groups of contacts) and send WhatsApp broadcasts to notify their crew about surf sessions.

## Database Setup

1. **Run Prisma migration** to add the new models:
```bash
cd backend
npx prisma migrate dev --name add_squads_and_broadcasts
```

2. **Generate Prisma Client**:
```bash
npx prisma generate
```

## WhatsApp Service Configuration

### Option 1: Twilio (Recommended for Free Tier)

1. **Sign up for Twilio**:
   - Go to https://www.twilio.com/try-twilio
   - Create a free account (includes $15.50 credit)

2. **Get WhatsApp Sandbox Access**:
   - In Twilio Console, go to Messaging > Try it out > Send a WhatsApp message
   - Follow instructions to join the sandbox (send "join [code]" to the provided number)
   - Note: Sandbox is for testing only, limited to verified numbers

3. **Get Production WhatsApp Access** (when ready):
   - Apply for WhatsApp Business API access through Twilio
   - Requires business verification

4. **Set Environment Variables**:
Add to `backend/.env`:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # Format: whatsapp:+[number]
```

### Option 2: Alternative Services

The `WhatsAppService` can be extended to support other providers:
- **MessageBird**: Has free tier
- **360dialog**: WhatsApp Business API provider
- **SendPulse**: Official WhatsApp Business Solution Provider

## Installation

1. **Install Twilio SDK** (if using Twilio):
```bash
cd backend
npm install twilio
```

## Features

### Squad Management
- Create squads with custom names
- Add members with phone numbers (E.164 format: +1234567890)
- Optional member names
- Edit and delete squads

### Broadcasts
- Select beach using the same beach search component as Raid Logs
- Set date and time for surf session
- Auto-generated default message: "Yo! I'm heading out to [beach.name] at [date, time]. Hopefully see you there! (This is an automated broadcast from www.tideraider.com)"
- Customizable message
- Sends WhatsApp messages to all squad members

## Access

The feature is available at: `/squads` (hidden page - not in navigation)

## API Endpoints

### Squads
- `GET /api/squads` - Get all squads for authenticated user
- `GET /api/squads/:id` - Get specific squad
- `POST /api/squads` - Create squad
- `PUT /api/squads/:id` - Update squad
- `DELETE /api/squads/:id` - Delete squad

### Broadcasts
- `POST /api/squads/broadcasts` - Create and send broadcast

## Database Models

### Squad
- `id`: UUID
- `name`: String
- `userId`: String (foreign key to User)
- `createdAt`, `updatedAt`: DateTime

### SquadMember
- `id`: UUID
- `squadId`: String (foreign key to Squad)
- `phoneNumber`: String (E.164 format)
- `name`: String? (optional)
- `createdAt`: DateTime

### Broadcast
- `id`: UUID
- `squadId`: String (foreign key to Squad)
- `beachId`: String? (foreign key to Beach, nullable)
- `beachName`: String? (stored in case beach is deleted)
- `message`: String
- `scheduledAt`: DateTime
- `sentAt`: DateTime? (when actually sent)
- `status`: BroadcastStatus (PENDING, SENT, FAILED)
- `createdAt`, `updatedAt`: DateTime

## Phone Number Format

All phone numbers must be in **E.164 format**:
- Starts with `+`
- Followed by country code (1-3 digits)
- Followed by subscriber number (max 15 digits total)
- Example: `+1234567890` (US), `+27812345678` (South Africa)

## Testing

1. **Create a Squad**:
   - Go to `/squads`
   - Click "Create Squad"
   - Add name and at least one member with phone number

2. **Send a Broadcast**:
   - Click "New Broadcast" on a squad
   - Select a beach
   - Set date and time
   - Customize message (or use default)
   - Click "Send Broadcast"

3. **Verify Messages**:
   - Check Twilio console for message logs
   - Verify messages were delivered to recipients

## Error Handling

- Invalid phone numbers are rejected with clear error messages
- Failed message sends are logged and broadcast status is set to "FAILED"
- Partial failures (some messages sent, some failed) are reported

## Future Enhancements

- Scheduled broadcasts (send at specific time)
- Broadcast history per squad
- Message templates
- Group management (add/remove members without recreating squad)
- Broadcast analytics



