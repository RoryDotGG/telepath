# 🤖 Telepath - AI-Powered Telegram Short Link Bot

<div align="center">

![Telepath Logo](https://img.shields.io/badge/Telepath-AI%20Short%20Links-blue?style=for-the-badge&logo=telegram)

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Telegraf](https://img.shields.io/badge/Telegraf-2CA5E0?style=flat-square&logo=telegram&logoColor=white)](https://telegraf.js.org/)
[![Dub.sh](https://img.shields.io/badge/Dub.sh-000000?style=flat-square&logo=link&logoColor=white)](https://dub.sh/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

*Transform any URL into an intelligent, memorable short link with the power of AI*

</div>

---

## 🚀 What is Telepath?

Telepath is an intelligent Telegram bot that creates memorable, AI-generated short links using **Google Gemini 2.5 Flash** and the **Dub.sh API**. Instead of random characters like `bit.ly/x7k2m`, get meaningful, memorable links like `dub.sh/ai-tutorial` or `mysite.com/product-launch`.

### 🎯 The Problem It Solves

- **Random short links are unmemorable** → AI creates meaningful slugs
- **No context about link content** → AI analyzes and generates relevant names
- **Manual slug creation is time-consuming** → Automated intelligent suggestions
- **Link management is scattered** → Centralized management with analytics

## ✨ Features

### 🧠 **AI-Powered Intelligence**
- **Smart Slug Generation**: Gemini AI analyzes URL content to create meaningful slugs
- **Context Understanding**: Recognizes content type, purpose, and creates relevant names
- **Multiple Slug Styles**: Intelligent, Short, Descriptive, or Technical styles
- **Custom Reasoning**: See why AI chose each specific slug

### 🔗 **Link Management**
- **Dub.sh Integration**: Professional short link creation with analytics
- **Custom Domain Support**: Use your own registered domains
- **Link Analytics**: Track clicks, locations, and performance
- **Link History**: View and manage all your created links
- **Bulk Operations**: Edit, delete, and manage multiple links

### 🎨 **User Experience**
- **Interactive Setup Wizard**: Personalized onboarding experience
- **Customizable Preferences**: Auto-confirm, domain selection, slug styles
- **Inline Keyboards**: Confirm, edit, or reject suggestions with buttons
- **Real-time Feedback**: Immediate AI analysis and suggestions
- **Error Recovery**: Comprehensive error handling with helpful messages

### 🛡️ **Security & Reliability**
- **Access Control**: Allow list authentication for authorized users only
- **Input Validation**: Secure URL processing and validation
- **Session Management**: Secure user session handling
- **Error Handling**: Graceful failure handling with user-friendly messages
- **Rate Limiting**: Built-in protection against API abuse
- **Database Integration**: Persistent user preferences and link storage

## 🛠️ Quick Start

### Prerequisites

- **Node.js 18+** with **pnpm**
- **Telegram Bot Token** (from [@BotFather](https://t.me/botfather))
- **Dub.sh API Key** (from [Dub.sh Dashboard](https://dub.sh/settings/tokens))
- **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd Telepath
   pnpm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   BOT_TOKEN=your_telegram_bot_token_here
   DUB_API_KEY=your_dub_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   NODE_ENV=development
   ALLOWED_USER_IDS=your_telegram_user_id_here
   ```

3. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Bot Configuration**
   ```bash
   pnpm setup  # Configures bot name, description, and commands
   ```

5. **Start the Bot**
   ```bash
   # Development with hot reload
   pnpm dev
   
   # Production
   pnpm build && pnpm start
   ```

## 🎯 Usage Guide

### 🏁 First Time Setup

1. **Start the bot** with `/start`
2. **Complete the setup wizard**:
   - Choose default domain (dub.sh or custom)
   - Select AI slug style preference
   - Configure auto-confirmation settings
   - Set reasoning display preferences

### 📱 Creating Short Links

1. **Send any URL** to the bot
2. **AI analyzes** the content and generates an intelligent slug
3. **Review the suggestion** with AI reasoning
4. **Choose your action**:
   - ✅ **Confirm** - Create the link
   - ✏️ **Edit** - Provide custom slug
   - ❌ **Cancel** - Abort creation
   - 🌐 **Change Domain** - Select different domain

### 🗂️ Managing Links

- **View all links**: `/links`
- **Link details**: Click any link to see analytics
- **Edit slug**: Modify existing link slugs
- **Delete links**: Remove unwanted links
- **Analytics**: View click counts and performance

### ⚙️ Customization

- **Settings**: `/settings` to modify preferences
- **Slug Styles**:
  - **Intelligent**: Balanced, contextual slugs
  - **Short**: Minimal, concise names
  - **Descriptive**: Detailed, explanatory slugs
  - **Technical**: Developer-friendly names

### 📋 Available Commands

| Command | Description |
|---------|-------------|
| `/start` | Start or restart the bot |
| `/help` | Show help and usage instructions |
| `/about` | Information about Telepath |
| `/links` | View and manage your short links |
| `/settings` | Configure your preferences |

## 🏗️ Architecture

### 📁 Project Structure

```
src/
├── bot.ts                     # Main bot entry point and routing
├── config.ts                  # Environment configuration
├── types/
│   └── index.ts              # TypeScript definitions
├── handlers/
│   ├── linkHandler.ts        # URL processing and AI integration
│   ├── setupHandler.ts       # User onboarding wizard
│   └── linkManagementHandler.ts # Link CRUD operations
├── services/
│   ├── aiService.ts          # Google Gemini integration
│   ├── dubService.ts         # Dub.sh API integration
│   ├── authService.ts        # User authentication and access control
│   ├── userPreferencesService.ts # User settings management
│   └── linkManagementService.ts # Link database operations
├── lib/
│   └── database.ts           # Prisma database connection
└── utils/
    ├── validators.ts         # URL validation and sanitization
    └── errorHandler.ts       # Comprehensive error management

prisma/
├── schema.prisma            # Database schema
└── migrations/              # Database migration files

scripts/
└── setup-bot.js            # Bot configuration script
```

### 🔧 Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **TypeScript** | Type-safe development | 5.8+ |
| **Node.js** | Runtime environment | 18+ |
| **Telegraf** | Telegram Bot Framework | 4.16+ |
| **Prisma** | Database ORM | 6.11+ |
| **SQLite** | Local database | - |
| **Dub SDK** | Short link API | 0.63+ |
| **Google Generative AI** | AI slug generation | 0.24+ |

### 🗄️ Database Schema

```sql
-- User preferences and setup state
model UserPreferences {
  id                   String    @id @default(cuid())
  userId               BigInt    @unique
  setupCompleted       Boolean   @default(false)
  defaultDomain        String    @default("dub.sh")
  preferredSlugStyle   String    @default("intelligent")
  autoConfirm          Boolean   @default(false)
  showReasoning        Boolean   @default(true)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  links                UserLink[]
}

-- User's created links
model UserLink {
  id                   String    @id @default(cuid())
  userId               BigInt
  linkId               String    @unique  // Dub.sh link ID
  domain               String
  key                  String
  url                  String
  shortLink            String
  clicks               Int?      @default(0)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime? @updatedAt
  userPreferences      UserPreferences @relation(fields: [userId], references: [userId], onDelete: Cascade)
  @@unique([domain, key])
}
```

## 🔧 Configuration

### 🌍 Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `BOT_TOKEN` | ✅ | Telegram bot token from @BotFather | `1234567890:ABC...` |
| `DUB_API_KEY` | ✅ | Dub.sh API key from dashboard | `dub_xyz123...` |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key | `AIza...` |
| `NODE_ENV` | ❌ | Environment mode | `development` |
| `ALLOWED_USER_IDS` | ❌ | Comma-separated list of authorized user IDs | `123456789,987654321` |

### 🔗 Service Setup

#### Telegram Bot Setup
1. Message [@BotFather](https://t.me/botfather)
2. Create new bot with `/newbot`
3. Choose a unique username (must end with 'bot')
4. Save your bot token securely
5. Optionally set bot profile picture and description

#### Dub.sh Setup
1. Create account at [dub.sh](https://dub.sh)
2. Navigate to [Settings → Tokens](https://dub.sh/settings/tokens)
3. Create a new API token
4. (Optional) Add custom domains in dashboard

#### Google Gemini Setup
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with Google account
3. Create new API key
4. Enable Gemini API access

#### Authentication Setup (Optional)
1. **Find your Telegram User ID**:
   - Message [@userinfobot](https://t.me/userinfobot) on Telegram
   - Or check bot logs when you first message your bot
   - Your user ID will be displayed as a number (e.g., `123456789`)

2. **Configure Access Control**:
   - Add `ALLOWED_USER_IDS=123456789,987654321` to your `.env` file
   - Include comma-separated user IDs for multiple users
   - Leave empty or omit to allow all users (default behavior)

3. **Test Access**:
   - Authorized users can use the bot normally
   - Unauthorized users receive a clear denial message
   - Check console logs for access attempts

## 🚀 Deployment

### 🏠 Local Development

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Initialize database
npx prisma generate
npx prisma db push

# Configure bot settings
pnpm setup

# Start development server
pnpm dev
```

### 🌐 Production Deployment

#### Traditional Hosting

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

#### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --prod

# Copy application code
COPY dist/ ./dist/
COPY prisma/ ./prisma/

# Set up database
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/bot.js"]
```

#### Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start dist/bot.js --name "telepath-bot"

# Save PM2 configuration
pm2 save
pm2 startup
```

## 🧪 Advanced Features

### 🎨 AI Slug Styles

#### Intelligent (Default)
- Balances readability and brevity
- Context-aware suggestions
- SEO-friendly format
- Example: `ai-tutorial-guide`

#### Short & Sweet
- Ultra-concise slugs
- Perfect for social sharing
- 3-8 characters typical
- Example: `ai-tut`

#### Descriptive
- Full context explanation
- Great for documentation
- Longer, detailed slugs
- Example: `comprehensive-ai-tutorial-beginners`

#### Technical
- Developer-friendly naming
- Uses technical terminology
- API and code-focused
- Example: `gemini-api-integration`

### 📊 Analytics Integration

The bot provides comprehensive analytics through Dub.sh:

- **Click Tracking**: Real-time click counting
- **Geographic Data**: See where clicks originate
- **Referrer Information**: Track traffic sources
- **Time-based Analytics**: Usage patterns over time
- **Device Analytics**: Desktop vs mobile usage

### 🔄 Session Management

- **Stateful Conversations**: Maintains context across messages
- **Setup Progress**: Tracks onboarding completion
- **Link Editing**: Handles multi-step edit workflows
- **Error Recovery**: Graceful session cleanup on errors

### 🛡️ Security Features

- **Access Control**: Allow list authentication for authorized users only
- **Input Sanitization**: All URLs validated and cleaned
- **SQL Injection Protection**: Prisma ORM with prepared statements
- **Rate Limiting**: Built-in protection against abuse
- **Error Message Sanitization**: No sensitive data in error messages
- **Secure Session Storage**: In-memory session management
- **Audit Logging**: Track unauthorized access attempts

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### 🔧 Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/telepath.git
   cd telepath
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Add your API keys
   ```

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### 📝 Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Consistent code style
- **Conventional Commits**: Structured commit messages

### 🧪 Testing

```bash
# Run type checking
pnpm build

# Run the bot in development
pnpm dev

# Test with real Telegram messages
```

### 📋 Pull Request Process

1. Create a feature branch
2. Make your changes
3. Add tests if applicable
4. Ensure TypeScript compilation
5. Test with actual bot interactions
6. Submit pull request with clear description

## 🆘 Troubleshooting

### Common Issues

#### Bot Not Responding
- ✅ Check bot token is correct
- ✅ Verify bot is started with `/start`
- ✅ Ensure API keys are valid
- ✅ Check network connectivity
- ✅ Verify user ID is in `ALLOWED_USER_IDS` (if configured)

#### AI Suggestions Not Working
- ✅ Verify Gemini API key
- ✅ Check Gemini API quota
- ✅ Ensure URL is accessible
- ✅ Try with different URL types

#### Link Creation Failing
- ✅ Validate Dub.sh API key
- ✅ Check domain permissions
- ✅ Verify slug availability
- ✅ Test API connectivity

#### Database Issues
- ✅ Run `npx prisma generate`
- ✅ Run `npx prisma db push`
- ✅ Check file permissions
- ✅ Verify SQLite installation

### 📝 Debug Mode

Enable detailed logging:

```bash
NODE_ENV=development pnpm dev
```

### 🔍 Log Analysis

Check console output for:
- API request/response details
- Error stack traces
- Session state information
- Database query logs

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Telegram** for the Bot API
- **Dub.sh** for reliable short link infrastructure
- **Google** for Gemini AI capabilities
- **Prisma** for excellent database tooling
- **Telegraf** for the elegant bot framework

## 🔮 Roadmap

### Version 1.1
- [ ] **Link Collections**: Organize links into folders
- [ ] **Bulk Operations**: Create multiple links at once
- [ ] **Link Templates**: Predefined slug patterns
- [ ] **Export Functionality**: Download link data

### Version 1.2
- [ ] **Advanced Analytics**: Custom dashboards
- [ ] **Link Expiration**: Time-based link deactivation
- [ ] **UTM Parameters**: Automatic campaign tracking
- [ ] **Link Preview**: Custom link preview cards

### Version 1.3
- [ ] **Multi-language Support**: Internationalization
- [ ] **Team Collaboration**: Shared link management
- [ ] **API Webhooks**: Real-time event notifications
- [ ] **Custom Domains**: Automated domain management

---

<div align="center">

**Built with ❤️ using TypeScript, Telegraf, Dub.sh, and Google Gemini AI**

[![GitHub Stars](https://img.shields.io/github/stars/telepath/telepath?style=social)](https://github.com/RoryDotGG/telepath)

[🐛 Report Bug](https://github.com/telepath/telepath/issues) • [💡 Request Feature](https://github.com/telepath/telepath/discussions)

</div>   