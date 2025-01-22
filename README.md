# URL Shortener Service

A high-performance URL shortening service built with modern technologies. This service provides URL shortening capabilities with advanced analytics, authentication, and caching mechanisms.

## 🚀 Features

### Core Functionality

- Custom URL shortening with alias support
- Secure redirect handling
- URL management dashboard
- Topic-based URL organization

### Analytics & Tracking

- Click tracking and analytics
- Unique visitor counting
- Device type detection
- Operating system tracking
- Browser identification
- Real-time statistics

### Security & Performance

- Google OAuth 2.0 authentication
- JWT-based authorization
- Redis caching layer
- Rate limiting
- Secure session handling

### Technical Features

- MongoDB for persistent storage
- Redis for caching and performance
- Docker containerization
- Microservices architecture
- RESTful API design

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Caching**: Redis
- **Authentication**: Google OAuth 2.0, JWT
- **Containerization**: Docker, Docker Compose
- **Analytics**: Custom analytics engine
- **Testing**: Jest (configured)

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 20.x (for local development)
- MongoDB 6.0+ (automatically handled by Docker)
- Redis 7.0+ (automatically handled by Docker)

## 🚀 Quick Start

### Using Docker (Recommended)

1. Clone the repository:

```bash
git clone <repository-url>
cd service
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Start the application:

```bash
docker compose up
```

The service will be available at `http://localhost:8080`

### Local Development Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start development server:

```bash
npm run serve
```

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
PORT=8080
APP_SECRET=your_secret_key

# MongoDB Configuration
MONGODB_CONNECTION_STRING=mongodb://mongodb:27017/tinyUrl

# Redis Configuration
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379

# Google OAuth (Required for authentication)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 📡 API Documentation

### Authentication Endpoints

#### Google OAuth Authentication

```http
POST /auth/googleAuth
Content-Type: application/json

{
    "accessToken": "google_access_token"
}
```

### URL Management Endpoints

#### Create Short URL

```http
POST /url/createurl
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
    "originalUrl": "https://example.com",
    "topic": "technology",
    "customAlias": "my-custom-url" // Optional
}
```

#### Redirect to Original URL

```http
GET /url/redirect/:shortId
Authorization: Bearer <jwt_token>
```

#### Get User's URLs

```http
GET /url/users/urls
Authorization: Bearer <jwt_token>
```

### Analytics Endpoints

#### URL-specific Analytics

```http
GET /analytics/url/:shortId
Authorization: Bearer <jwt_token>
```

#### Topic-based Analytics

```http
GET /analytics/topic/:topic
Authorization: Bearer <jwt_token>
```

#### Overall Analytics

```http
GET /analytics/overall
Authorization: Bearer <jwt_token>
```

## 📁 Project Structure

```
├── api/                  # API routes and endpoint definitions
│   ├── analytics.api.js  # Analytics endpoints
│   ├── auth.api.js      # Authentication endpoints
│   └── url.api.js       # URL management endpoints
│
├── controllers/          # Request handlers and business logic
│   ├── analytics.controllers.js
│   ├── auth.controllers.js
│   └── url.controllers.js
│
├── models/              # Database models and schemas
│   ├── analytics.model.js
│   ├── url.model.js
│   └── user.model.js
│
├── services/            # Business logic and service layer
│   ├── analytics.service.js
│   ├── auth.service.js
│   └── url.service.js
│
├── lib/                 # Shared utilities and helpers
│   └── redis.js        # Redis client configuration
│
├── bin/                 # Application entry points
│   └── www             # Server initialization
│
└── docker/             # Docker configuration files
```

## 🔒 Security Features

- JWT-based authentication
- Rate limiting on API endpoints
- Secure session handling
- CORS protection
- XSS prevention
- Input validation
- MongoDB injection prevention

## 🚀 Deployment

### Docker Deployment

The application is containerized and can be deployed using Docker Compose:

```bash
# Production deployment
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Manual Deployment

1. Build the application:

```bash
npm run build
```

2. Start the server:

```bash
npm start
```

## 📈 Monitoring & Maintenance

### Health Checks

The application provides health check endpoints:

- `/health` - Basic health check
- `/health/detailed` - Detailed system status

### Logging

- Application logs are available in the `logs/` directory
- Docker logs can be viewed using `docker compose logs`

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- analytics.test.js
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Suraj Pandey**

## 🙏 Acknowledgments

- MongoDB team for the excellent database
- Redis Labs for the caching solution
- Express.js team for the web framework
- Docker team for containerization support
