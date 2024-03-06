from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv
import openai
from llama_index.core import VectorStoreIndex
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.core.memory import ChatMemoryBuffer
from llama_index.core.postprocessor import MetadataReplacementPostProcessor
import chromadb
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


# Load environment variables
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
llm = OpenAI(model="gpt-3.5-turbo-0125")

db = chromadb.PersistentClient(path="./chroma_db")
embed_model = OpenAIEmbedding(model="text-embedding-3-small", embed_batch_size=50)

sentence_window_collection = db.get_or_create_collection("sentence_window")
sentence_window_vector_store = ChromaVectorStore(
    chroma_collection=sentence_window_collection
)

sentence_index = VectorStoreIndex.from_vector_store(
    sentence_window_vector_store,
    embed_model=embed_model,
)

memory = ChatMemoryBuffer.from_defaults(token_limit=3900)

sentence_query_engine = sentence_index.as_chat_engine(
    similarity_top_k=5,
    memory=memory,
    chat_mode="condense_plus_context",
    node_postprocessors=[
        MetadataReplacementPostProcessor(target_metadata_key="window")
    ],
    context_prompt=(
        "You are a chatbot, able to have normal interactions, as well as talk"
        " about the HBS faculty."
        "Here are the relevant documents for the context:\n"
        "{context_str}"
        "\nInstruction: Use the previous chat history, or the context above, to interact and help the user."
    ),
)


@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    question = data.get("question")
    if not question:
        return jsonify({"error": "No question provided"}), 400

    response = sentence_query_engine.chat(question)
    print(response.response)
    return jsonify({"response": response.response})


@app.route("/query", methods=["GET"])
def query():
    text = request.args.get("text")
    if not text:
        return (
            "No text found, please include a ?text=question parameter in the URL",
            400,
        )

    response = sentence_query_engine.chat(text)
    return str(response), 200


if __name__ == "__main__":
    app.run(debug=True)
