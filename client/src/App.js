import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:5000");

function App() {
  const [userId, setUserId] = useState("");
  const [interests, setInterests] = useState([]);
  const [msg, setMsg] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [matchedUser, setMatchedUser] = useState(null);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  const availableInterests = [
    "Sports",
    "Music",
    "Movies",
    "Tech",
    "Travel",
    "Religion",
    "Astronomy",
    "Science",
  ];

  useEffect(() => {
    socket.on("welcome", (message) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { user: "System", text: message },
      ]);
    });

    socket.on("receiveMessage", (message) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { user: "Stranger", text: message },
      ]);
    });

    socket.on("matched", ({ userId, interests }) => {
      setMatchedUser({ userId, interests });
      setConnecting(false);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          user: "System",
          text: `You have been matched with a user interested in ${interests.join(
            ", "
          )}`,
        },
      ]);
    });

    socket.on("connected", () => {
      console.log("Connected to server");
      setMsg("Connected to server. Finding Chat Partner...");
      setConnecting(true);
      setConnected(true);
    });

    socket.on("error", (message) => {
      setError(message);
      setConnecting(false);
    });

    socket.on("chatPartnerDisconnected", (message) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { user: "System", text: message },
      ]);
      setMatchedUser(null);
      setConnecting(false);
    });

    return () => {
      socket.off("welcome");
      socket.off("receiveMessage");
      socket.off("matched");
      socket.off("connected");
      socket.off("error");
      socket.off("chatPartnerDisconnected");
    };
  }, []);

  const connectToChat = () => {
    if (userId.trim() && interests.length > 0) {
      socket.emit("register", { userId, interests });
    } else {
      setError("Please enter a user ID and select at least one interest.");
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("sendMessage", message);
      setMessages((prevMessages) => [
        ...prevMessages,
        { user: "You", text: message },
      ]);
      setMessage("");
    }
  };

  return (
    <div className="App">
      {!connected ? (
        <div className="connect-container">
          <input
            type="text"
            placeholder="Enter your user ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <div className="interests">
            {availableInterests.map((interest) => (
              <label key={interest}>
                <input
                  type="checkbox"
                  value={interest}
                  checked={interests.includes(interest)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setInterests((prev) => [...prev, interest]);
                    } else {
                      setInterests((prev) =>
                        prev.filter((i) => i !== interest)
                      );
                    }
                  }}
                />
                {interest}
              </label>
            ))}
          </div>
          <button onClick={connectToChat} style={{width:"30%"}}>Connect</button>
          {error && <p className="error">{error}</p>}
        </div>
      ) : (
        <div className="chat-container">
          {connecting ? (
            <p>{msg}</p>
          ) : (
            <div className="messages">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${
                    msg.user === "You" ? "sent" : "received"
                  }`}
                >
                  <strong>{msg.user}:</strong> {msg.text}
                </div>
              ))}
            </div>
          )}

          <div className="input-container">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
