# Tide Raider Backend API

Express.js backend API for Tide Raider, deployed on Fly.io.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables (see `.env.example`):

```bash
cp .env.example .env
```

3. Generate Prisma Client:

```bash
npm run prisma:generate
```

4. Run database migrations:

```bash
npm run prisma:migrate
```

## Development

Run the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## Production

Build the project:

```bash
npm run build
```

Start the server:

```bash
npm start
```

## Deployment to Fly.io

1. Install Fly CLI: https://fly.io/docs/getting-started/installing-flyctl/

2. Login to Fly.io:

```bash
fly auth login
```

3. Launch the app:

```bash
fly launch
```

4. Set environment variables:

```bash
fly secrets set DATABASE_URL=your_database_url
fly secrets set NEXTAUTH_SECRET=your_secret
# ... add other secrets
```

5. Deploy:

```bash
fly deploy
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/beaches` - Get all beaches (optional query: `?regionId=xxx`)
- `GET /api/beaches/:name` - Get beach by name

More endpoints to be added...

## Environment Variables

Required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for JWT token verification
- `FRONTEND_URL` - Frontend URL for CORS (e.g., `https://your-app.vercel.app`)
- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL (optional)
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token (optional)

See `.env.example` for full list.
