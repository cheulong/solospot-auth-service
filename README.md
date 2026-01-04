# Auth Service

This is the authentication service for SoloSpot.

## Features
- Health check endpoint
- User registration using email and password
  - Same email check
  - Secure password hashing
- Login with email and password
  - Check if user exists
  - Compare hashed passwords
  - Generate JWT token(access token + refresh token) with expiration
  - Return both tokens to client
<!-- - JWT token management
- Password hashing and validation
- Role-based access control
- Database integration with Drizzle ORM
- Environment configuration with dotenv
- API documentation with Swagger/OpenAPI
- Error handling and logging
- Continuous integration and deployment
- TypeScript type safety
- Unit and integration testing
- Docker containerization
- Health check endpoint
- RESTful API design -->

## To start

Run the development server:
```bash
bun run dev
```

Run tests:
```bash
bun run test
```

Start the production server:
```bash
bun run start
```

Run with Docker:
```bash
docker build -t auth-service .
docker run -p 3000:3000 auth-service
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

## Environment Variables
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `NODE_ENV` - Environment (development/production)

