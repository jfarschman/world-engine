World Engine
World Engine is a high-performance world-building and campaign management tool designed for tabletop RPGs like Dungeons & Dragons and DaggerHeart. It allows Game Masters to organize lore, track characters, manage locations, and maintain session journals in a centralized, searchable database.

🚀 Quick Start (Local Development)
1. Prerequisites

Ensure you have the following installed:

Node.js (v18.x or higher)

npm

Git

PostgreSQL

2. Clone and Install

Bash
git clone https://github.com/<your-username>/world-engine.git
cd world-engine
npm install
3. Environment Setup

Create a .env file in the root directory:

Code snippet
DATABASE_URL="postgresql://<user>:<password>@localhost:5433/<db_name>"
NEXTAUTH_SECRET="<generate-a-random-secret>"
NEXTAUTH_URL="http://localhost:3000"
Note: If you are using a production database via an SSH tunnel, ensure your DATABASE_URL points to the correct local port (e.g., 5433).

4. Database Setup

Sync your Prisma schema and generate the client:

Bash
npx prisma generate
npx prisma db push
5. Run the Server

Bash
npm run dev
Access the app at http://localhost:3000.

🛠 Tech Stack
Framework: Next.js (App Router)

Database & ORM: PostgreSQL with Prisma

Styling: Tailwind CSS

Authentication: NextAuth.js

Media Handling: Local filesystem storage with dynamic focal point positioning

Exporting: JSZip and Turndown for Markdown backups

🔒 Security & Best Practices
Singleton Prisma Client: Prevents "too many clients" errors by attaching the client to the global scope during development.

Nginx Hardening: Configured with server_tokens off; and custom rate limiting on the /api/search endpoint to mitigate fingerprinting and scraping.

Focal Point Logic: Images utilize focal_x and focal_y coordinates to ensure critical visual elements (like NPC faces) remain centered in thumbnails.

🛰 Development Workflow
Database SSH Tunneling

To connect your local environment to a remote production database:

Bash
ssh -i <path-to-your-key.pem> -L 5433:localhost:5432 <user>@<server-address>
Media Synchronization (rsync)

To pull gallery images from the production server to your local machine:

Bash
rsync -avz -e "ssh -i <path-to-your-key.pem>" "<user>@<server-address>:~/world-engine/public/gallery/*" ./public/gallery/
📂 Project Structure
/src/app: Next.js pages and API routes.

/src/components: UI components (Sidebar, Search, RichTextEditor).

/src/lib: Shared utilities (Prisma client, Auth configuration).

/public/gallery: Storage for uploaded entity images.

schema.prisma: The database source of truth.
