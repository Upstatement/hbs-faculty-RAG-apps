import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { v4 as uuidv4 } from "uuid";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

function App() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null); // Create a ref for the end of the chat

  const initializeNewSession = async () => {
    if (!sessionStorage.getItem("uniqueID")) {
      sessionStorage.setItem("uniqueID", uuidv4());
    }
  };

  const handleInputChange = (event) => {
    setQuery(event.target.value);
  };

  useEffect(() => {
    initializeNewSession();
    setMessages([
      {
        text: "Hello! I can answer your questions about the HBS Faculty.",
        sender: "bot",
      },
    ]);
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;

    // Add user's query to messages
    const sendQuery = query;
    setQuery(""); // Clear input after submit
    setMessages((msgs) => [...msgs, { text: sendQuery, sender: "user" }]);
    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          uniqueID: sessionStorage.getItem("uniqueID"),
        },
        body: JSON.stringify({ question: sendQuery }),
      });
      const data = await res.json();
      setMessages((msgs) => [...msgs, { text: data.response, sender: "bot" }]);
    } catch (error) {
      console.error("Error fetching response:", error);
      setMessages((msgs) => [
        ...msgs,
        { text: "Failed to get response", sender: "bot" },
      ]);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>HBS Faculty Directory Chat</h1>
        <div className="chat-box">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.sender}`}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(marked.parse(msg.text)), // Correct use of marked.parse
              }}
            ></div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Ask me something..."
          />
          <button type="submit">Send</button>
        </form>
      </header>
    </div>
  );
}

export default App;
