import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { Button, Modal, Checkbox } from "antd";
import { clean } from "../node_modules/profanity-cleaner/dist/profanity-cleaner";

const socket = io(
  process.env.PROD_URL ? process.env.PROD_URL : "http://localhost:5000"
);

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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [agreement, setAgreement] = useState(
    localStorage.getItem("agreedToDisclaimer") === "true"
  );
  const badWordsArray = process.env.REACT_APP_BADWORDS
    ? process.env.REACT_APP_BADWORDS.split(", ")
    : [];

  const availableInterests = [
    "Sports",
    "Music",
    "Movies",
    "Tech",
    "Travel",
    "Religion",
    "Astronomy",
    "Science",
    "Default chat",
  ];

  useEffect(() => {
    // Generate or retrieve user ID
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      const newUserId = generateUniqueId(12);
      localStorage.setItem("userId", newUserId);
      setUserId(newUserId);
    } else {
      setUserId(storedUserId);
    }

    // Retrieve interests from local storage
    const storedInterests = JSON.parse(localStorage.getItem("interests")) || [];
    if (storedInterests.length === 0) {
      // If no interests are saved, default to "Default"
      storedInterests.push("Default chat");
    }
    setInterests(storedInterests);

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

  const generateUniqueId = (length) => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };

  const connectToChat = () => {
    if (userId && interests.length > 0 && agreement) {
      socket.emit("register", { userId, interests });
    } else {
      setError(
        "Please select at least one interest and agree to the disclaimer."
      );
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit(
        "sendMessage",
        clean(message, { customBadWords: badWordsArray })
      );
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          user: "You",
          text: clean(message, { customBadWords: badWordsArray }),
        },
      ]);
      setMessage("");
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    setAgreement(isChecked);
    if (isChecked) {
      localStorage.setItem("agreedToDisclaimer", "true");
    } else {
      localStorage.removeItem("agreedToDisclaimer");
    }
  };

  const handleInterestChange = (interest) => {
    setInterests((prev) => {
      let newInterests;
      if (prev.includes(interest)) {
        newInterests = prev.filter((i) => i !== interest);
      } else {
        newInterests = [...prev, interest];
      }
      localStorage.setItem("interests", JSON.stringify(newInterests));
      return newInterests;
    });
  };

  return (
    <div className="App" style={{ padding: 0, margin: 0 }}>
      <div
        className="disclaimer"
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "center",
          marginTop: 5,
        }}
      >
        <Button onClick={showModal}>Read Disclaimer</Button>
      </div>
      {!connected ? (
        <div className="connect-container">
          <div
            className="interests"
            style={{ display: "flex", gap: 10, justifyContent: "center" }}
          >
            {availableInterests.map((interest) => (
              <label key={interest}>
                <input
                  type="checkbox"
                  value={interest}
                  checked={interests.includes(interest)}
                  onChange={() => handleInterestChange(interest)}
                />
                {interest}
              </label>
            ))}
          </div>
          <Checkbox checked={agreement} onChange={handleCheckboxChange}>
            I agree to the terms and conditions
          </Checkbox>
          <button onClick={connectToChat} style={{ width: "30%" }}>
            Connect
          </button>
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

      <Modal
        title="Security Disclaimer"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[
          <Button key="ok" onClick={handleOk}>
            OK
          </Button>,
        ]}
      >
        <p>
          Please be cautious when chatting with strangers online.  </p>
      </Modal>
    </div>
  );
}

export default App;
