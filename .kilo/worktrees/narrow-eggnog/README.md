# AI Call Assistant

A production-ready admin dashboard for monitoring and managing AI-powered phone calls through [Vapi.ai](https://vapi.ai). Built with React, TypeScript, Supabase, and TanStack.

![AI Call Assistant](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)

## 🎯 Features

### Call Monitoring

- **Real-time Dashboard**: Live overview of call volume, duration, and costs
- **Call List**: Search, filter, and paginate through all calls
- **Call Details**: View recordings, transcripts, and AI-generated summaries
- **Audio Playback**: Listen to call recordings directly in the browser
- **Live Updates**: Automatic refresh when new calls arrive via webhooks

### User Management

- **Role-Based Access**: Admin and Viewer roles with granular permissions
- **User Invitation**: Admins can create and invite new users
- **Access Control**: Activate/deactivate users and manage roles
- **Profile Management**: View user information and activity

### Vapi Integration

- **Webhook Handler**: Secure endpoint for receiving Vapi events
- **Manual Sync**: Fetch historical calls from Vapi on demand
- **Connection Testing**: Verify Vapi API credentials
- **Event Processing**: Handle status updates, transcripts, and recordings

### Security

- **Authentication**: Secure email/password auth via Supabase
- **Row Level Security**: Database-level access control
- **Role Enforcement**: Multi-layer permission checks
- **Webhook Validation**: Cryptographic verification of incoming events
- **Secret Management**: Server-side handling of sensitive credentials

## 🏗️ Architecture

```
┌─────────────┐
│  Vapi AI    │
│  Phone      │
│  System     │
└──────┬──────┘
       │ Webhooks
       ↓
┌─────────────────────┐
│  TanStack Start     │
│  API Route          │
│  /api/vapi-webhook  │
└──────┬──────────────┘
       │ Validate & Process
       ↓
┌─────────────────────┐
│  Supabase           │
│  PostgreSQL         │
│  + Row Level        │
│    Security         │
└──────┬──────────────┘
       │ Queries
       ↓
┌─────────────────────┐
│  React Frontend     │
│  (Vite)             │
│  + TanStack Query   │
│  + Realtime Updates │
└─────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ ([install with nvm](https://github.com/nvm-sh/nvm))
- A [Supabase](https://supabase.com) project
- A [Vapi.ai](https://vapi.ai) account

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd ai-call-assistant
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Supabase credentials:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
   ```

4. **Run database migrations**

   ```bash
   # Using Supabase CLI
   supabase link --project-ref your-project-ref
   supabase db push

   # Or manually via Supabase SQL Editor
   # Copy and run each migration file from supabase/migrations/
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to `http://localhost:5173` and create your first admin account.

## 📚 Documentation

- **[Deployment Guide](DEPLOYMENT.md)**: Complete production deployment instructions
- **[Development Guide](DEVELOPMENT.md)**: Detailed development setup and workflow
- **[Database Schema](supabase/migrations/)**: SQL migrations and schema documentation

## 🛠️ Technology Stack

### Frontend

- **React 19**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **TanStack Router**: Type-safe routing
- **TanStack Query**: Server state management
- **React Hook Form + Zod**: Form handling and validation
- **Tailwind CSS v4**: Styling
- **shadcn/ui**: Component library
- **Recharts**: Data visualization
- **Lucide React**: Icons

### Backend

- **TanStack Start**: Server functions and API routes
- **Supabase**: Database, authentication, and real-time
- **PostgreSQL**: Relational database with RLS
- **Vapi.ai**: Voice AI platform

## 📖 Usage

### Creating Users

1. Log in as admin
2. Navigate to **Users**
3. Click **Add user**
4. Fill in name, email, temporary password, and role
5. User receives credentials to log in

### Monitoring Calls

1. Go to **Dashboard** for overview statistics and recent calls
2. Visit **Calls** to search, filter, and paginate through all calls
3. Click any call to view full details, transcript, and recording

### Syncing Vapi Data

1. Navigate to **Calls**
2. Click **Sync Vapi calls** (admin only)
3. Historical calls are imported from Vapi

### Testing Vapi Connection

1. Go to **Settings** (admin only)
2. Click **Test connection**
3. Verify the connection status

## 🔒 Security

This application implements defense-in-depth security:

1. **Authentication**: Supabase Auth with session management
2. **Authorization**: Role-based access control (admin/viewer)
3. **Database Security**: Row Level Security (RLS) policies
4. **API Security**: Server-side validation and secret handling
5. **Webhook Security**: Cryptographic signature verification
6. **Secret Management**: Environment variables for sensitive data

**Never commit** the following to version control:

- `.env` file with credentials
- `VAPI_PRIVATE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPI_SERVER_SECRET`

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

## 📦 Build and Deploy

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Deployment Platforms

- **Vercel**: Recommended for seamless TanStack Start deployment
- **Netlify**: Alternative with similar setup
- **Supabase**: Handles database, auth, and real-time

## 🔧 Configuration

### Environment Variables

**Frontend (public)**:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase public key

**Backend (secret)**:

- `VAPI_PRIVATE_KEY`: Vapi API private key
- `VAPI_ASSISTANT_ID`: Your Vapi assistant ID
- `VAPI_SERVER_SECRET`: Webhook validation secret
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase admin key

### Vapi Webhook Setup

Set your webhook URL in Vapi dashboard:

```
https://your-app.vercel.app/api/public/vapi-webhook
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and test thoroughly
4. Commit with clear messages (`git commit -m 'feat: add amazing feature'`)
5. Push to your branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev)
- Powered by [Vapi.ai](https://vapi.ai)
- Database by [Supabase](https://supabase.com)
- UI components by [shadcn/ui](https://ui.shadcn.com)

## 📧 Support

For issues and questions:

- **Vapi Integration**: [Vapi Documentation](https://docs.vapi.ai)
- **Database/Auth**: [Supabase Documentation](https://supabase.com/docs)
- **Framework**: [TanStack Start](https://tanstack.com/start)

---

**Built with ❤️ for AI voice automation**
#   c a l l i n g - a g e n t  
 