# Task Manager API with AI Integration
Live Link(https://task-manager-api-with-ai-integratio.vercel.app/)

A REST API built with **Node.js**, **Express.js**, **MongoDB (Atlas)** and **Mongoose** that manages tasks and uses the **Groq AI API** to generate intelligent task plans from plain-English descriptions.

## Features

- Full CRUD operations for tasks (Create, Read, Update, Delete)
- AI-powered task planning endpoint (`POST /api/ai/plan-task`)
- **Modern web dashboard UI** served at `http://localhost:5000`
- Input validation and meaningful error messages
- Centralized error handling middleware
- Environment variable configuration with `.env`
- Ready for deployment on Render (config included)

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | Web framework |
| MongoDB Atlas | Database |
| Mongoose | ODM |
| dotenv | Environment variables |
| Groq API | AI task planning |
| Postman | API testing |

## Project Structure

```
Task Manager API with AI Integration/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── task.controller.js     # Task CRUD logic
│   └── ai.controller.js       # AI planning logic
├── middleware/
│   └── error.middleware.js    # 404 + global error handler
├── models/
│   └── task.model.js          # Mongoose Task schema
├── public/                    # Frontend dashboard UI
│   ├── index.html             # Dashboard page
│   ├── style.css              # Modern dark theme styles
│   └── app.js                 # Frontend logic (fetch API)
├── routes/
│   ├── task.routes.js         # /api/tasks routes
│   └── ai.routes.js           # /api/ai routes
├── .env                       # Local secrets (not committed)
├── .env.example               # Variable names only
├── .gitignore
├── app.js                     # Express app setup
├── server.js                  # Server entry point
├── render.yaml                # Render deployment blueprint
└── postman_collection.json    # Postman collection
```

## Setup & Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd task-manager-api
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in your values:

   ```
   MONGODB_URI=your_mongodb_atlas_connection_string
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL=llama-3.3-70b-versatile
   PORT=5000
   NODE_ENV=development
   ```

4. **Run the server**

   ```bash
   npm run dev    # development (with nodemon)
   npm start      # production
   ```

The server starts at `http://localhost:5000`.

## Frontend Dashboard

Open **http://localhost:5000** in your browser to use the modern dashboard UI:

- **Stats bar** — total / pending / in-progress / completed counts
- **Create & edit tasks** — form with title, description, status, due date
- **Task list** — search, edit (✎) and delete (🗑) tasks
- **AI Planner** — enter a description and get an instant step-by-step plan with priority and estimated hours

The frontend is a lightweight vanilla HTML/CSS/JS app served by Express from the `public/` folder — no extra build step needed.

## API Endpoints

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create a new task |
| GET | `/api/tasks` | Retrieve all tasks |
| GET | `/api/tasks/:id` | Retrieve a single task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

### AI Assistant

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/plan-task` | Generate an AI task plan |

### Request / Response Examples

**Create Task** — `POST /api/tasks`

```json
{
  "title": "Complete assignment",
  "description": "Finish the Task Manager API project",
  "status": "pending",
  "dueDate": "2026-10-20"
}
```

Response (201):

```json
{
  "success": true,
  "data": {
    "_id": "652f...",
    "title": "Complete assignment",
    "description": "Finish the Task Manager API project",
    "status": "pending",
    "dueDate": "2026-10-20T00:00:00.000Z",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**AI Plan** — `POST /api/ai/plan-task`

```json
{
  "description": "I need to build a portfolio website within three days."
}
```

Response (200):

```json
{
  "success": true,
  "plan": {
    "summary": "Build and launch a personal portfolio website.",
    "priority": "high",
    "estimatedHours": 12,
    "steps": [
      "Plan the website structure",
      "Build the responsive layout",
      "Add projects and contact information",
      "Test and deploy the website"
    ]
  }
}
```

## Error Handling

The API returns appropriate HTTP status codes with meaningful messages:

| Scenario | Status | Message |
|----------|--------|---------|
| Missing title on create | 400 | `Title is required` |
| Invalid status value | 400 | `Status must be pending, in-progress or completed` |
| Invalid MongoDB ID | 400 | `Invalid task ID format` |
| Task does not exist | 404 | `Task not found` |
| Unknown route | 404 | `Route not found: ...` |
| Missing AI description | 400 | `A non-empty task description is required` |
| AI API failure | 502 | `Failed to get a response from the AI provider` |
| Invalid AI response | 502 | `AI returned an invalid response format` |
| AI timeout | 504 | `AI request timed out. Please try again.` |

## How the AI API is Integrated

1. The client sends a task description to `POST /api/ai/plan-task`.
2. The backend validates that a non-empty description was provided (400 if missing).
3. The description is sent from the backend (never the browser) to Groq's OpenAI-compatible chat completions endpoint: `https://api.groq.com/openai/v1/chat/completions`.
4. A **system prompt** instructs the model to return strict JSON with four fields: `summary`, `priority` (low/medium/high), `estimatedHours`, and `steps` (3–7 actionable items).
5. **JSON mode** is enabled (`response_format: { type: "json_object" }`) so the model returns reliably parseable JSON.
6. The AI response is parsed and validated. If the structure is wrong, a `502` error is returned.
7. The result is returned to the client in the required structured format: `{ "success": true, "plan": { ... } }`.
8. The **API key is stored in `.env`** on the server and is never exposed to frontend code or committed to GitHub.

> Note: You are not required to train an AI model — this is a straightforward integration of an existing AI API.

## Testing with Postman

1. Import `postman_collection.json` into Postman.
2. Set the collection variables:
   - `baseUrl` → `http://localhost:5000` (or your live URL)
   - `taskId` → auto-filled after running **Create Task**
3. Run the requests in order:

   **Happy path:** Create Task → Get All Tasks → Get Single Task → Update Task → Delete Task

   **Error handling:** Invalid Task ID → Missing Title → Invalid Status → Task Not Found

   **AI:** Plan Task → Plan Task - Missing Description

## Deployment (Render)

1. Push your code to GitHub (**without** `.env`).
2. Create a **MongoDB Atlas** cluster and get the connection string.
3. Get a free **Groq API key** from [console.groq.com](https://console.groq.com/keys).
4. On [Render](https://render.com), create a new **Web Service** from your repo.
   - Build command: `npm install`
   - Start command: `npm start`
5. Add environment variables in Render's dashboard:
   - `MONGODB_URI`
   - `GROQ_API_KEY`
   - `GROQ_MODEL` = `llama-3.3-70b-versatile`
   - `NODE_ENV` = `production`
6. Deploy. Render provides the `PORT` automatically — the app reads it from `process.env.PORT`.
7. Test the live endpoints, including the AI endpoint (make sure your Groq quota allows it).

A `render.yaml` blueprint is included for one-click setup.

## Security Notes

- Never commit `.env` — it is listed in `.gitignore`.
- Only `.env.example` (variable names, no secrets) is committed.
- The AI API key lives on the server only; all AI calls are made from the backend.
