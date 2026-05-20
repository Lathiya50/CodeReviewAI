# AI Code Reviewer

An intelligent AI-powered code review platform that automatically analyzes GitHub pull requests and provides comprehensive feedback, suggestions, and risk assessments. Built with Next.js, this application integrates with GitHub to streamline the code review process using advanced AI models.

## Features

- 🤖 **Automated Code Reviews**: Leverage AI (Google Gemini & OpenAI) to automatically review pull requests
- ⚡ **Auto Review on Push**: Connect a repo once — every new PR and every pushed commit is reviewed and commented on automatically, with zero manual steps
- 🪝 **Automatic Webhook Setup**: Connecting a repo auto-registers a GitHub webhook (with a per-repo secret); disconnecting tears it down
- 🔐 **GitHub Integration**: Seamless authentication and repository synchronization
- 📊 **Dashboard Analytics**: Visualize review statistics, activity heatmaps, and risk scores
- 🎯 **Risk Assessment**: Intelligent scoring system to identify potential issues
- 💬 **Inline Comments**: AI-generated comments posted directly to GitHub PRs
- 🎛️ **Per-Repo Automation Controls**: Toggle auto-review and auto-post, and choose `COMMENT` vs `REQUEST_CHANGES` per repository
- 🔄 **Background Processing**: Asynchronous review processing using Inngest
- 🌙 **Dark Mode**: Built-in theme support for comfortable viewing
- 📱 **Responsive Design**: Works seamlessly across desktop and mobile devices

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Better Auth](https://www.better-auth.com/) with GitHub OAuth
- **AI Models**: Google Gemini API & OpenAI API
- **Background Jobs**: [Inngest](https://www.inngest.com/)
- **API Layer**: [tRPC](https://trpc.io/) for type-safe APIs
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with Radix UI components
- **State Management**: TanStack Query (React Query)
- **Animations**: Framer Motion & React Spring

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 20.x or higher
- pnpm (recommended) or npm
- PostgreSQL database
- GitHub OAuth App credentials
- Google Gemini API key or OpenAI API key

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/aicodereviewer"

# Authentication
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# AI API Keys (use at least one)
GOOGLE_GEMINI_API_KEY="your-gemini-api-key"
OPENAI_API_KEY="your-openai-api-key"

# Inngest
INNGEST_EVENT_KEY="your-inngest-event-key"
INNGEST_SIGNING_KEY="your-inngest-signing-key"
```

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/aicodereviewer.git
   cd aicodereviewer
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up the database**:
   ```bash
   pnpm db:generate
   pnpm db:push
   ```

4. **Run the development server**:
   ```bash
   pnpm dev
   ```

5. **In a separate terminal, run Inngest dev server**:
   ```bash
   pnpm inngest:dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Available Scripts

- `pnpm dev` - Start the Next.js development server
- `pnpm inngest:dev` - Start the Inngest development server
- `pnpm build` - Build the application for production
- `pnpm build:full` - Generate Prisma client and build the application
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint for code quality checks
- `pnpm db:push` - Push database schema changes to the database
- `pnpm db:generate` - Generate Prisma Client

## How It Works

1. **Authentication**: Users sign in with their GitHub account
2. **Repository Sync**: The app syncs accessible GitHub repositories
3. **Auto Webhook Registration**: Connecting a repo automatically creates a GitHub webhook (subscribed to `pull_request` events) with a per-repo HMAC secret — no manual webhook setup
4. **Push Triggers Review**: Opening a PR or pushing commits to an open PR delivers a `pull_request` event to the webhook, which creates a review and enqueues an Inngest job
5. **AI Analysis**: Pull requests are analyzed using AI models (Gemini/OpenAI)
6. **Review Generation**: AI generates comprehensive feedback with risk scores
7. **Comment Posting**: When auto-post is enabled, reviews are posted back to the PR automatically (inline comments)
8. **Dashboard**: Users can view all reviews, statistics, and activity

## Database Schema

The application uses PostgreSQL with the following main models:

- **User**: User accounts with GitHub authentication
- **Repository**: Synced GitHub repositories
- **Review**: AI-generated code reviews with status tracking
- **Session**: User session management
- **Account**: OAuth account information

## Project Structure

```
aicodereviewer/
├── prisma/              # Database schema and migrations
├── src/
│   ├── app/            # Next.js app router pages
│   │   ├── (auth)/     # Authentication pages
│   │   ├── (dashboard)/# Dashboard and repository pages
│   │   └── api/        # API routes and webhooks
│   ├── components/     # React components
│   ├── constant/       # Constants and configuration
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility libraries
│   └── server/         # Server-side code (tRPC routers, Inngest functions)
└── package.json
```

## Key Features Explained

### Automatic PR Review on Push
The core promise: connect a repository once, and every PR is reviewed automatically — no manual clicks.

- **On connect**: the app calls the GitHub API to register a repository webhook pointing at `${APP_URL}/api/webhooks/github`, subscribed to `pull_request` events, with a freshly generated per-repo secret. The hook id, secret, and status are stored on the `Repository` row (`webhookStatus` becomes `ACTIVE`).
- **On push**: GitHub delivers a `pull_request` event when a PR is **opened**, **synchronized** (new commits), or **reopened**. Draft PRs, ignored actions, and bot senders are skipped. The webhook verifies the HMAC signature against the per-repo secret, creates a `Review`, and sends a `review/pr.requested` Inngest event.
- **On review complete**: if `autoPostEnabled` is on, the Inngest job posts the AI review back to the PR as inline comments (`COMMENT` or `REQUEST_CHANGES`). A post failure is a soft error — the review still saves and shows `COMPLETED`.
- **Per-repo controls**: `autoReviewEnabled` (run review on push), `autoPostEnabled` (post back to GitHub vs. dashboard-only), and `postEvent`. A `reconnectWebhook` action re-registers a failed/missing hook; `disconnect` deletes the hook from GitHub.

> **Local development note:** GitHub must reach the webhook endpoint over **public HTTPS** — it cannot deliver to `localhost`. For local testing, run a tunnel (e.g. `ngrok http 3000`) and point `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` at the tunnel URL so the registered webhook and the OAuth callback both use it. A plain `git push` does **not** trigger a review — the change must arrive as a Pull Request (opened, or new commits on an already-open PR).

### Automated Reviews
When a pull request is opened or updated, the system:
- Fetches the diff and file changes from GitHub
- Analyzes code patterns, potential bugs, and best practices
- Generates inline comments with suggestions
- Calculates a risk score based on complexity and potential issues

### Dashboard
The dashboard provides:
- Overview of all reviewed pull requests
- Activity heatmap showing review frequency
- Statistics including total reviews, risk scores, and success rates
- Quick access to repository management

### Background Processing
Uses Inngest for reliable background job processing:
- Asynchronous PR analysis to avoid blocking
- Retry logic for failed reviews
- Status tracking (PENDING → PROCESSING → COMPLETED/FAILED)

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

## License

This project is private and proprietary.

## Support

For issues or questions, please open an issue in the GitHub repository.
