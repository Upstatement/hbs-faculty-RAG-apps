# run this server if you're running the chat app
from flask import Flask, request, jsonify
from flask_cors import CORS
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
import json

app = Flask(__name__)
CORS(app, supports_credentials=True)

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
    sentence_window_vector_store, embed_model=embed_model
)

# Store session-specific ChatMemoryBuffers in server memory
chat_memories = {}


def get_chat_memory(uniqueID):
    chat_memory_id = uniqueID
    if chat_memory_id not in chat_memories:
        # Initialize a new ChatMemoryBuffer for this session
        print("new session started with id: " + chat_memory_id)
        chat_memories[chat_memory_id] = ChatMemoryBuffer.from_defaults(token_limit=3900)
    return chat_memories[chat_memory_id]


def getMessagesFromChatBuffer(chat_memory):
    chat_history = chat_memory.get_all()
    messages = [
        {"role": message.role, "content": message.content} for message in chat_history
    ]
    return messages


def getSuggestedQuestions(messages):

    system_prompt = {
        "role": "system",
        "content": "The following is a conversation about the HBS faculty with a chatbot that has access to HBS faculty information",
    }

    prompt = {
        "role": "user",
        "content": "Give me three follow up questions based on this conversation I can ask you, return them as JSON with the three questions under the 'data' key as follows { 'data': ['question 1' , 'question 2', 'question 3'] } ",
    }

    all_messages = [system_prompt, *messages, prompt]

    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=all_messages,
        response_format={"type": "json_object"},
    )
    return response.choices[0].message


@app.route("/chat", methods=["POST"])
def chat():
    uniqueID = request.headers.get("uniqueID")
    chat_memory = get_chat_memory(
        uniqueID
    )  # Retrieve or initialize the session-specific ChatMemoryBuffer
    question = request.json.get("question")
    if not question:
        return jsonify({"error": "No question provided"}), 400

    response = sentence_index.as_chat_engine(
        similarity_top_k=5,
        memory=chat_memory,  # Use the session-specific memory here
        chat_mode="condense_plus_context",
        node_postprocessors=[
            MetadataReplacementPostProcessor(target_metadata_key="window")
        ],
        context_prompt=(
            "You are a chatbot, able to have normal interactions, as well as talk"
            " about the HBS faculty. Focus your answers on including information from the relevant documents on HBS."
            "Here are the relevant documents for the context:\n"
            "{context_str}"
            "\nInstruction: Use the previous chat history, or the context above, to interact and help the user. Ensure that the responses are relevant to HBS."
        ),
    ).chat(question)

    return jsonify({"response": response.response})


@app.route("/follow-up-questions", methods=["POST"])
def follow_up_questions():
    uniqueID = request.headers.get("uniqueID")
    if uniqueID not in chat_memories:
        return jsonify({"error": "Session not found"}), 404

    chat_memory = chat_memories[uniqueID]
    messages = getMessagesFromChatBuffer(chat_memory)
    follow_ups = getSuggestedQuestions(messages)
    parsed_content = json.loads(follow_ups.content)

    return jsonify({"questions": parsed_content["data"]})


if __name__ == "__main__":
    app.run(debug=True)
