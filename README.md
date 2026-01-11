# Auth Service

This is the authentication service for SoloSpot.

## To start

### Prerequisites
#### Environment Variables
- `PORT` - Server port (default: 5000)
- `DATABASE_URL` - PostgreSQL connection string
- `ACCESS_TOKEN_SECRET` - Access JWT signing secret
- `REFRESH_TOKEN_SECRET` - Refresh JWT signing secret
- `NODE_ENV` - Environment (development/production)
- `ENCRYPTION_KEY` - Encryption key for sensitive data
- `BREVO_SMTP_USER` - Brevo SMTP username
- `BREVO_SMTP_KEY` - Brevo SMTP key

#### Run the development server:
```bash
bun run dev
```

#### Run tests:
```bash
bun run test
```

#### Start the production server:
```bash
bun run build
bun run start
```

#### Run with Docker:
```bash
docker build -t auth-service .
docker run -p 5000:5000 auth-service
```
#### Run with Docker Compose:
```bash
docker compose -f compose.dev.yml up
```

#### Stopping the app

```bash
docker compose -f compose.dev.yml down 'dev' --rmi local --volumes
```

#### Building the app

```bash
docker build -f Dockerfile.prod -t <username>/solospot-auth-service:0.0.1 .
```

#### Pushing the app to Docker Hub

```bash
docker push <username>/solospot-auth-service:0.0.1
```

## Migration

Run database migrations:
```bash
bunx drizzle-kit generate
bunx drizzle-kit migrate

```
Run database seed:
```bash
bun run seed
```

## Features
- Health check endpoint
- User registration using email and password
- Login with email and password
- Logout
- Change password
- Forget password
- Reset password
- Verify OTP
- Setup 2FA
- Verify 2FA
- 2FA backup code
- Fetch new access token using refresh token
- Revoke refresh token
- Magic link
- Passwordless login

<!-- ### Pipeline CI/CD stages

- prepare
- sast_scan
- test
- build
- security
- dast_scan
- deploy
- release
- slack_notify 
- clean_up-->
