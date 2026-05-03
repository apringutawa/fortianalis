# FortiAnalis: FortiWeb Log Analyzer

FortiAnalis is a full-stack web application designed to analyze FortiWeb logs. It provides a user-friendly interface to upload log files, process them, and visualize key security insights.

## Features

- **Log Upload**: Easily upload FortiWeb log files.
- **AI-Powered Analysis**: Leverage AI for deeper insights into log data.
- **Interactive Dashboard**: Visualize security events, threats, and traffic patterns.

## Local Deployment

To run FortiAnalis locally using Docker Compose:

1.  **Prerequisites**:
    *   Docker Desktop installed (includes Docker Compose).
    *   Git installed.

2.  **Clone the Repository**:
    ```bash
    git clone https://github.com/apringutawa/fortianalis.git
    cd fortianalis
    ```

3.  **Build and Run with Docker Compose**:
    ```bash
    docker-compose up --build
    ```

    *   The backend will be accessible at `http://localhost:8001` (or `http://localhost:7860` as per `Dockerfile`).
    *   The frontend will be accessible at `http://localhost:3000`.

## VPS (Ubuntu) Deployment with Docker Compose

For deploying FortiAnalis on an Ubuntu VPS, Docker Compose is recommended for its ease of setup and consistent environment.

1.  **Prerequisites**:
    *   An Ubuntu Server VPS.
    *   SSH access to your VPS.
    *   Docker and Docker Compose installed on your VPS. (Follow official Docker documentation for installation on Ubuntu).
    *   Git installed on your VPS.

2.  **Clone the Repository on VPS**:
    ```bash
    ssh user@your_vps_ip
    git clone https://github.com/apringutawa/fortianalis.git
    cd fortianalis
    ```

3.  **Environment Variables**: Create a `.env` file in the root of the project with necessary environment variables, e.g., `GEMINI_API_KEY`, `ALLOWED_ORIGINS`.

    ```env
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    ALLOWED_ORIGINS="http://localhost:3000,https://your-frontend-domain.com"
    ```

4.  **Build and Run with Docker Compose**:
    ```bash
    docker-compose up --build -d
    ```
    The `-d` flag runs the containers in detached mode.

5.  **Accessing the Application**:
    *   Ensure your VPS firewall (e.g., UFW) allows traffic on ports 8001 (or 7860) and 3000.
    *   You can access the backend via `http://your_vps_ip:8001` (or 7860) and the frontend via `http://your_vps_ip:3000`. For production, use a reverse proxy like Nginx to handle domains and SSL.

## Deployment via `deploy.sh` (Railway & Vercel)

This project includes a `deploy.sh` script for deploying the backend to Railway and the frontend to Vercel. This method requires respective CLI tools and accounts.

1.  **Prerequisites**:
    *   [Railway CLI](https://docs.railway.app/cli/reference) installed (`npm install -g @railway/cli`).
    *   [Vercel CLI](https://vercel.com/download) installed (`npm install -g vercel`).
    *   Railway and Vercel accounts.

2.  **Login to CLIs**:
    Run `railway login` and `vercel login` in your terminal.

3.  **Run Deployment Script**:
    ```bash
    ./deploy.sh
    ```

    *   The script will attempt to deploy the backend to Railway and the frontend to Vercel.
    *   **Important**: After deployment, manually add `GEMINI_API_KEY` to Railway environment variables and your Vercel domain to `ALLOWED_ORIGINS` in Railway.

## Development

### Backend (FastAPI)

Located in the `backend/` directory.

### Frontend (Next.js)

Located in the `frontend/` directory.

