# Hiregenix-Backend-TS

## Technology Stack

### Core Backend
- Node.js
- TypeScript
- Express
- MongoDB
- Mongoose
- Node Cron
- Rabbitmq
- QdrantDB

### Authentication and Authorization
- bcrypt for password hashing
- jsonwebtoken for JWT access tokens
- googleapis for Google OAuth login
- axios for fetching Google user profile data after OAuth
- cookie-parser for request cookie handling

### Validation and Security
- zod for request validation
- cors for frontend/backend cross-origin access
- express-rate-limit for throttling repeated requests

### Email and Notifications
- nodemailer for verification emails and password reset OTP emails

### File Upload and Storage
- multer for file uploads
- cloudinary for storing resumes and uploaded files

### Messaging and Realtime
- socket.io for realtime chat and live updates

### Queues and Background Jobs
- amqplib for RabbitMQ integration
- node-cron for scheduled interview reminders and job deadline jobs

### AI, Search, and Retrieval
- @google/generative-ai for Gemini-based generation
- langchain and related LangChain Google packages for AI/RAG workflows
- @huggingface/inference for Hugging Face inference support
- @qdrant/js-client-rest for Qdrant vector search

### External Verification and APIs
- @aws-sdk/client-rekognition for face verification

### Utilities
- dayjs and luxon for date/time handling
- dotenv for environment variables

