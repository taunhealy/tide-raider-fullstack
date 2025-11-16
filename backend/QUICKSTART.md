# Backend Quick Start

## Initial Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

4. **Run database migrations (if needed):**
   ```bash
   npm run prisma:migrate
   ```

## Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## Testing

Test the health endpoint:
```bash
curl http://localhost:3001/health
```

Test the beaches endpoint:
```bash
curl http://localhost:3001/api/beaches
```

## Building

Build for production:
```bash
npm run build
```

The compiled files will be in the `dist/` directory.

## Deployment to Fly.io

1. **Install Fly CLI:**
   ```bash
   # macOS/Linux
   curl -L https://fly.io/install.sh | sh
   
   # Windows (PowerShell)
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Login to Fly.io:**
   ```bash
   fly auth login
   ```

3. **Launch the app:**
   ```bash
   fly launch
   ```
   Follow the prompts. This will create a `fly.toml` file (already created).

4. **Set secrets:**
   ```bash
   fly secrets set DATABASE_URL=your_database_url
   fly secrets set NEXTAUTH_SECRET=your_secret
   fly secrets set FRONTEND_URL=https://your-app.vercel.app
   # Add other secrets as needed
   ```

5. **Deploy:**
   ```bash
   fly deploy
   ```

6. **Check status:**
   ```bash
   fly status
   fly logs
   ```

## Common Issues

### TypeScript Errors
If you see TypeScript errors about missing modules, make sure you've run:
```bash
npm install
```

### Prisma Errors
If Prisma client is not found:
```bash
npm run prisma:generate
```

### Database Connection
Make sure `DATABASE_URL` is set correctly in your `.env` file or Fly.io secrets.

## Next Steps

- Add more API routes in `src/routes/`
- Update `src/routes/index.ts` to register new routes
- See `MIGRATION_GUIDE.md` for migrating Next.js API routes

