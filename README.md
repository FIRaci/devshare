# 🌐 DevShare

> A modern, fast, and feature-rich community platform tailored for developers. Share your knowledge, ask questions, and engage with your favorite tech communities!

<div align="center">
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React" />
  <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white" alt="Bun" />
  <img src="https://img.shields.io/badge/ElysiaJS-%23F8C300.svg?style=for-the-badge&logo=elysiajs&logoColor=black" alt="Elysia" />
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</div>

<br />

## 🚀 Features

- **Blazing Fast Performance**: Powered by Bun on the backend and Vite on the frontend.
- **Rich Media Support**: Specialized beautiful link preview rendering for TikTok, Facebook, Instagram, YouTube, and X/Twitter.
- **Markdown Editor**: Write posts and comments beautifully with Markdown syntax, GFM supported.
- **Robust Authentication**: JWT-based authentication via Elysia.
- **Dynamic User Interface**: Framer Motion powered micro-interactions, responsive sidebars, and skeleton loading.
- **Relational Database**: PostgreSQL + Prisma for scalable and type-safe data modeling.

## 🛠 Tech Stack

### Frontend
- **React 19**
- **Vite 8**
- **Framer Motion** (for fluid UI animations)
- **Lucide React** (icons)
- **React Markdown & Remark GFM**

### Backend
- **Bun** runtime
- **ElysiaJS** (High performance TypeScript framework)
- **Prisma ORM**
- **PostgreSQL** (Dockerized)

## 💻 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/), [Bun](https://bun.sh/), and [Docker](https://www.docker.com/) installed on your local machine.

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/FIRaci/devshare.git
   cd devshare
   ```

2. **Start the Database:**
   ```bash
   npm run start-db
   ```
   *(Ensure Docker is running)*

3. **Install Dependencies & Start the App:**
   ```bash
   npm run dev
   ```
   *This command uses `concurrently` to spin up both the Elysia backend and the Vite frontend simultaneously.*

4. **Access the application:**
   - Frontend: `http://localhost:5174` (or whatever Vite assigns)
   - Backend API: `http://localhost:3001`

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Developed with ❤️ by <a href="https://github.com/FIRaci">FIRaci</a>
</p>
