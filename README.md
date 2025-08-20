# Real-Time Chat Application

A comprehensive, production-ready real-time chat application built with Node.js, Express, Socket.IO, TypeScript, MySQL, and Redis. Features include user authentication, real-time messaging, room management, and comprehensive validation.

## ✨ Features

### 🔐 **User Authentication & Security**
- **JWT-based authentication** with secure token handling
- **Password hashing** using bcrypt with salt rounds
- **User registration and login** with validation
- **User profile management** and logout functionality
- **Role-based access control** (admin/member) for rooms

### 💬 **Chat Rooms & Messaging**
- **Room creation** (public/private with invite codes)
- **Room joining** via room ID or invitation link
- **Real-time messaging** with Socket.IO
- **Message persistence** in MySQL with full CRUD operations
- **Message editing and deletion** with permission checks
- **Read receipts** and delivery status tracking
- **Typing indicators** for real-time user feedback

### 🚀 **Real-Time Communication**
- **Socket.IO integration** for instant communication
- **User presence tracking** (online/offline with last seen)
- **Real-time broadcasting** to all users in a room
- **Rate limiting** to prevent abuse (5 messages per 10 seconds)
- **Comprehensive validation** at all layers

### 🛡️ **Security & Performance**
- **Input validation** using Zod schemas
- **API rate limiting** (100 requests per minute)
- **SQL injection prevention** via ORM
- **CORS configuration** for web security
- **Error handling** with proper HTTP status codes

### 🐳 **Deployment & Infrastructure**
- **Docker support** with multi-stage builds
- **Docker Compose** for local development
- **Render deployment** ready with blueprints
- **Environment configuration** management


## 📦 Installation & Setup

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/)

### Quick Start with Docker

```bash
# 1. Clone the repository
git clone <repository-url>
cd Real-Time-Communication-app

# 2. Copy environment file
cp example.env .env

# 3. Start all services (app + MySQL + Redis)
docker compose up --build -d

# 4. Access your application
open http://localhost:8080
```

### Local Development Setup

```bash
# 1. Start only dependencies
docker compose up -d db redis

# 2. Install Node.js dependencies
npm install

# 3. Set up environment variables
cp example.env .env
# Edit .env with your database credentials

# 4. Run the application
npm run dev
```

## 🔧 Available Scripts

```bash
npm run dev          # Start development server with nodemon
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
```

## �� API Reference

### Base URL
```
http://localhost:8080/api/v1
```

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

##  Socket.IO Events

### Client to Server Events

```javascript
// Join a chat room
socket.emit('join_room', { roomId: 'uuid' });

// Send a message
socket.emit('send_message', { 
  roomId: 'uuid', 
  content: 'Hello, world!' 
});

// Edit a message
socket.emit('edit_message', { 
  messageId: 'uuid', 
  content: 'Updated content' 
});

// Delete a message
socket.emit('delete_message', { messageId: 'uuid' });

// Mark message as read
socket.emit('mark_message_read', { messageId: 'uuid' });

// Typing indicator
socket.emit('typing', { 
  roomId: 'uuid', 
  isTyping: true 
});
```

### Server to Client Events

```javascript
// Welcome message
socket.on('welcome', (data) => {
  console.log(data.message); // "Hello, User {userId}"
});

// New message received
socket.on('receive_message', (message) => {
  console.log('New message:', message);
});

// Message edited
socket.on('message_edited', (message) => {
  console.log('Message edited:', message);
});

// Message deleted
socket.on('message_deleted', (data) => {
  console.log('Message deleted:', data.messageId);
});

// Message read
socket.on('message_read', (data) => {
  console.log('Message read:', data);
});

// User status changes
socket.on('user_status', (data) => {
  console.log('User status:', data);
});

// Typing indicator
socket.on('typing', (data) => {
  console.log('User typing:', data);
});

// Error messages
socket.on('error', (data) => {
  console.error('Socket error:', data.message);
});
```

## ️ Database Schema

### Users Table
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary Key |
| `username` | String(50) | Unique username |
| `email` | String(100) | Unique email |
| `password` | String(255) | Hashed password |
| `fullName` | String(100) | User's full name |
| `isOnline` | Boolean | Online status |
| `lastSeen` | DateTime | Last activity timestamp |
| `createdAt` | DateTime | Account creation time |
| `updatedAt` | DateTime | Last update time |

### Rooms Table
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary Key |
| `name` | String(100) | Room name |
| `description` | Text | Room description (optional) |
| `isPrivate` | Boolean | Private room flag |
| `inviteCode` | String(20) | Invitation code (unique) |
| `createdBy` | UUID | Creator user ID (FK) |
| `createdAt` | DateTime | Room creation time |
| `updatedAt` | DateTime | Last update time |

### Room Members Table
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary Key |
| `roomId` | UUID | Room ID (FK) |
| `userId` | UUID | User ID (FK) |
| `role` | Enum | 'admin' or 'member' |
| `joinedAt` | DateTime | Join timestamp |
| `createdAt` | DateTime | Record creation time |
| `updatedAt` | DateTime | Last update time |

### Messages Table
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary Key |
| `roomId` | UUID | Room ID (FK) |
| `senderId` | UUID | Sender user ID (FK) |
| `content` | Text | Message content |
| `messageType` | Enum | 'text', 'image', or 'file' |
| `isEdited` | Boolean | Edit flag |
| `editedAt` | DateTime | Edit timestamp (optional) |
| `deliveredAt` | DateTime | Delivery timestamp |
| `readAt` | DateTime | Read timestamp (optional) |
| `createdAt` | DateTime | Message creation time |
| `updatedAt` | DateTime | Last update time |


### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (production/development) | ✅ Yes |
| `PORT` | Server port | ✅ Yes |
| `JWT_SEC` | JWT signing secret | ✅ Yes |
| `REFRESH_TOKEN` | Refresh token secret | ✅ Yes |
| `MYSQL_HOST` | MySQL host address | ✅ Yes |
| `MYSQL_PORT` | MySQL port | ✅ Yes |
| `MYSQL_USER` | MySQL username | ✅ Yes |
| `MYSQL_PASSWORD` | MySQL password | ✅ Yes |
| `MYSQL_DATABASE` | MySQL database name | ✅ Yes |
| `REDIS_URL` | Redis connection string | ✅ Yes |

## 🧪 Testing the Application

### 1. Test Authentication

```bash
# Register a user
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Test Room Operations

```bash
# Create a room (use token from login)
curl -X POST http://localhost:8080/api/v1/rooms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Room",
    "description": "A test room",
    "isPrivate": false
  }'
```

### 3. Test WebSocket Connection

```javascript
// Connect to Socket.IO
const socket = io('http://localhost:8080', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

// Join a room
socket.emit('join_room', { roomId: 'ROOM_UUID' });

// Send a message
socket.emit('send_message', { 
  roomId: 'ROOM_UUID', 
  content: 'Hello, world!' 
});
```

## 📁 Project Structure

```
Real-Time-Communication-app/
├── src/
│   ├── api/
│   │   ├── middlewares/          # Authentication, rate limiting, error handling
│   │   └── v1/
│   │       ├── controllers/      # Business logic (auth, rooms, messages)
│   │       ├── routes/           # API route definitions
│   │       └── validators/       # Input validation schemas
│   ├── config/                   # Socket.IO and Redis configuration
│   ├── db/
│   │   ├── models/               # Database models (User, Room, Message, RoomMember)
│   │   └── index.ts              # Database initialization and associations
│   ├── errors/                   # Custom HTTP error classes
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Helper functions
│   ├── validators/               # Validation schemas
│   ├── app.ts                    # Express application setup
│   └── server.ts                 # Server entry point
├── docs/                         # Additional documentation
├── docker-compose.yml            # Local development services
├── Dockerfile                    # Production container build
├── render.yaml                   # Render deployment blueprint
├── package.json                  # Dependencies and scripts
└── README.md                     # This file
```

## 🔒 Security Features

### Authentication & Authorization
- **JWT-based authentication** with secure token handling
- **Password hashing** with bcrypt (12 salt rounds)
- **Token expiration** (24 hours)
- **Role-based access control** for room management

### Input Validation
- **Comprehensive validation** using Zod schemas
- **UUID validation** for all IDs
- **Content length limits** and sanitization
- **SQL injection prevention** via Sequelize ORM

### Rate Limiting
- **Message rate limiting**: 5 messages per 10 seconds
- **API rate limiting**: 100 requests per minute
- **Redis-based rate limiting** for scalability

### Data Protection
- **CORS configuration** for web security
- **Input sanitization** and validation
- **Proper error handling** without information leakage

## 🚀 Performance Features

### Database Optimization
- **Indexed queries** for fast data retrieval
- **Efficient associations** with Sequelize
- **Connection pooling** for database connections

### Caching & Real-time
- **Redis caching** for session management
- **WebSocket optimization** with Socket.IO
- **Rate limiting** to prevent abuse

### Scalability
- **Stateless architecture** for horizontal scaling
- **Docker containerization** for easy deployment
- **Environment-based configuration**

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check TypeScript compilation
npm run build

# Verify dependencies
npm install
```

#### Database Connection Issues
- Verify MySQL service is running
- Check environment variables
- Ensure database user has proper permissions

#### WebSocket Connection Issues
- Verify JWT token is valid
- Check CORS configuration
- Monitor browser console for errors

#### Rate Limiting Issues
- Check Redis connection
- Verify rate limit configuration
- Monitor application logs

### Debug Mode

```bash
# Enable debug logging
DEBUG=socket.io:* npm run dev

# Check application logs
docker compose logs -f app
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests if applicable
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

- **Follow TypeScript best practices**
- **Add proper validation** for new endpoints
- **Include error handling** for all operations
- **Write clear commit messages**
- **Test your changes** before submitting

## 📄 License

This project is licensed under the **ISC License** - see the [LICENSE](LICENSE) file for details.

##  Acknowledgments

- **Socket.IO** for real-time communication
- **Sequelize** for database ORM
- **Zod** for schema validation
- **Render** for deployment platform
- **Docker** for containerization

## 📞 Support

If you encounter any issues or have questions:

1. **Check the troubleshooting section** above
2. **Review the logs** in your deployment platform
3. **Open an issue** on GitHub with detailed information
4. **Check the API documentation** for endpoint details
# real-time-communication-app
