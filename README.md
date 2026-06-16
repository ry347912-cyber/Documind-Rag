# DocuMind — Chat with Your PDFs, Get Cited Answers

[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![LangChain](https://img.shields.io/badge/LangChain-0.2-yellow)](https://langchain.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-purple?logo=openai)](https://openai.com)
[![React](https://img.shields.io/badge/React-18-cyan?logo=react)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)](https://docker.com)

> **Upload PDFs or DOCX files. Ask any question. Get GPT-4o answers with exact page citations — powered by a production RAG pipeline.**

---

## 📸 Demo

> **Live demo:** [https://your-demo-link-here.com](https://your-demo-link-here.com)

```
User: "What are the key risks in the annual report?"

DocuMind: "The report identifies three primary risks: supply chain disruptions
[Source: report.pdf, Page 12], regulatory changes in the EU market
[Source: report.pdf, Page 34], and increased competition from Asian
manufacturers [Source: report.pdf, Page 41]."
```

---

## 🏗️ Architecture

```
  ┌──────────┐    ┌──────────┐    ┌──────────────┐
  │  PDF /   │───▶│  Chunk   │───▶│  OpenAI Ada  │
  │  DOCX    │    │  (500c)  │    │  Embeddings  │
  └──────────┘    └──────────┘    └──────┬───────┘
                                         │
                                  ┌──────▼───────┐
                                  │   ChromaDB   │
                                  │  (cosine sim)│
                                  └──────┬───────┘
                       question          │ top-5 chunks
                  ┌────────────┐  ┌──────▼───────┐
                  │   User     │──▶   GPT-4o     │
                  │  Question  │  │  + citations │
                  └────────────┘  └──────┬───────┘
                                         │ SSE stream
                                  ┌──────▼───────┐
                                  │  Cited Answer│
                                  └──────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Backend** | Python | 3.11 |
| **API framework** | FastAPI | 0.111 |
| **LLM orchestration** | LangChain | 0.2 |
| **Language model** | OpenAI GPT-4o | latest |
| **Embeddings** | text-embedding-ada-002 | — |
| **Vector store** | ChromaDB | 0.5 |
| **Relational DB** | PostgreSQL | 16 |
| **Document parsing** | PyPDF2 + python-docx | 3.0 / 1.1 |
| **Frontend** | React | 18 |
| **Styling** | Tailwind CSS | 3.4 |
| **Bundler** | Vite | 5 |
| **Containerisation** | Docker + Compose | — |
| **CI/CD** | GitHub Actions | — |
| **Hosting** | Render | — |

---

## 🚀 Local Setup (one command)

### Prerequisites
- Docker & Docker Compose installed
- OpenAI API key

### 1. Clone
```bash
git clone https://github.com/yourusername/documind.git
cd documind
```

### 2. Configure
```bash
cp backend/.env.example .env
# Edit .env and set OPENAI_API_KEY=sk-...
```

### 3. Run
```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| FastAPI backend | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |
| Frontend (dev) | http://localhost:5173 |
| PostgreSQL | localhost:5432 |
| ChromaDB | http://localhost:8001 |

### 4. Frontend dev server (optional, for hot reload)
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

---

## 📁 Project Structure

```
rag-project/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app, CORS, lifespan, routers
│   │   ├── api/
│   │   │   ├── upload.py         # POST /api/upload
│   │   │   ├── query.py          # POST /api/query (SSE streaming)
│   │   │   └── documents.py      # GET/DELETE /api/documents
│   │   ├── core/
│   │   │   ├── chunker.py        # RecursiveCharacterTextSplitter wrapper
│   │   │   ├── embedder.py       # OpenAI ada-002 batch embedder
│   │   │   └── vector_store.py   # ChromaDB store/search/delete
│   │   └── db/
│   │       └── postgres.py       # SQLAlchemy models + async session
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Router
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Landing page
│   │   │   └── Chat.jsx          # Main chat layout
│   │   └── components/
│   │       ├── PDFUploader.jsx   # Drag-drop upload + progress
│   │       ├── DocumentList.jsx  # Sidebar with checkboxes
│   │       ├── ChatWindow.jsx    # SSE streaming chat UI
│   │       ├── CitationCard.jsx  # Purple citation badge
│   │       └── HowItWorks.jsx    # RAG explanation page
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI: test → build → push → deploy
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 🔌 API Reference

### `POST /api/upload`
Upload a PDF or DOCX file.
- **Body:** `multipart/form-data`, field `file`
- **Returns:** Document record JSON

### `POST /api/query`
Ask a question over selected documents.
- **Body:** `{ "question": "...", "document_ids": [1, 2] }`
- **Returns:** SSE stream of `{ type, content }` events

### `GET /api/documents`
List all uploaded documents.

### `DELETE /api/documents/{id}`
Delete a document and its vector data.

---

## 🔐 GitHub Actions Secrets Required

| Secret | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `RENDER_DEPLOY_HOOK_URL` | Render service deploy hook URL |

---

## 🧠 What I Learned

Building DocuMind taught me the real mechanics behind modern AI applications:

- **Vector embeddings** — How text is converted to high-dimensional float vectors where semantic similarity corresponds to geometric proximity (cosine distance). The `text-embedding-ada-002` model produces 1536-dimensional vectors.

- **Semantic search vs keyword search** — Cosine similarity retrieval finds conceptually related chunks even when exact keywords don't match, solving the vocabulary mismatch problem.

- **RAG architecture** — Why grounding LLM responses in retrieved context dramatically reduces hallucination: the model is forced to cite actual text rather than confabulate.

- **SSE streaming** — Server-Sent Events enable real-time token delivery from the OpenAI streaming API to the browser, using a simple `EventSource`-compatible chunked HTTP response — no WebSockets needed.

- **Chunking strategy** — Why chunk size and overlap matter: too large = less precise retrieval; too small = lost context. 500 chars with 50 overlap is a practical starting point.

- **Async FastAPI** — How `asyncio`-native DB sessions (asyncpg + SQLAlchemy 2.0) and async OpenAI clients eliminate thread-per-request overhead at scale.

- **Docker multi-stage builds** — Separating build and runtime stages cuts final image size significantly and keeps secrets out of layers.

---

## 📄 License

MIT — feel free to fork for your own portfolio.
