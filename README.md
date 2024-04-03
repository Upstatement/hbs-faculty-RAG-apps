# HBS Faculty Directory RAG Apps

These are two prototypes to explore the [HBS Faculty Directory](https://www.hbs.edu/faculty/Pages/browse.aspx?faculty=Current) using retrieval augmented generation (RAG).

The backend under `app.py` is a llamaindex chat engine that queries a vector store in `chroma_db`

The main guidance-refinement prototype is `user-query-form/` which uses a form input to build the RAG query, and then LLM-driven suggested questions for follow up responses.

`chat-app/` contains a chat app that takes the input and uses that for queries to the llamaindex chat engine, and directly displays the responses.

## Installation

Install git-lfs, which is used to store the vector DB. Then clone this repo.

Make a copy of `.env-example` to `.env` and add your OpenAI key.

Start a virtual environment with `venv`, running `python -m venv venv` and then start it with `source venv/bin/activate`.

install dependencies `pip install -r requirements.txt`

In each of the prototype directories `user-query-form` and `chat-app`, install the respective app with `npm install`.

## Running

Navigate to the frontend app in `user-query-form/` and run `npm run build`. Start the server with `python3 app.py`

If instead you are running the chat app, navigate to `chat-app/` and `npm run build`, then start the server with `python3 chat_server.py`.
