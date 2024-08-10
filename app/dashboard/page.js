"use client";
import {
  Box,
  Stack,
  TextField,
  Paper,
  Typography,
  IconButton,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import { useState, useEffect, useRef, use } from "react";
import { logout, auth, db } from "../../firebase";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { CircularProgress } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";
import Avatar from "@mui/material/Avatar";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [Dbmessages, setDbmessages] = useState([]);
  const [language, setLanguage] = useState("en");

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(scrollToBottom, [messages]);
  const handlechange = (e) => {
    setLanguage(e.target.value);
  };
  function AIreply() {
    if (language == "en") {
      return "Hello, how can I help you today?";
    } else if (language == "es") {
      return "Hola, ¿cómo puedo ayudarte hoy?";
    } else if (language == "ja") {
      return "こんにちは、今日はどうお手伝いしましょうか？";
    } else if (language == "fr") {
      return "Bonjour, comment puis-je vous aider aujourd'hui ?";
    } else if (language == "Ger") {
      return "Hallo, wie kann ich Ihnen heute helfen?";
    } else if (language == "it") {
      return "Ciao, come posso aiutarti oggi?";
    }
  }

  useEffect(() => {
    if (language == "en") {
      setMessages(() => [
        ...Dbmessages,
        {
          role: "assistant",
          content: "Hello, how can I help you today?",
          timestamp: serverTimestamp(),
        },
      ]);
    } else if (language == "es") {
      setMessages(() => [
        ...Dbmessages,
        {
          role: "assistant",
          content: "Hola, ¿cómo puedo ayudarte hoy?",
          timestamp: serverTimestamp(),
        },
      ]);
    } else if (language == "ja") {
      setMessages(() => [
        ...Dbmessages,
        {
          role: "assistant",
          content: "こんにちは、今日はどうお手伝いしましょうか？",
          timestamp: serverTimestamp(),
        },
      ]);
    } else if (language == "fr") {
      setMessages(() => [
        ...Dbmessages,
        {
          role: "assistant",
          content: "Bonjour, comment puis-je vous aider aujourd'hui ?",
          timestamp: serverTimestamp(),
        },
      ]);
    } else if (language == "Ger") {
      setMessages(() => [
        ...Dbmessages,
        {
          role: "assistant",
          content: "Hallo, wie kann ich Ihnen heute helfen?",
          timestamp: serverTimestamp(),
        },
      ]);
    } else if (language == "it") {
      setMessages(() => [
        ...Dbmessages,
        {
          role: "assistant",
          content: "Ciao, come posso aiutarti oggi?",
          timestamp: serverTimestamp(),
        },
      ]);
    }
  }, [language]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setLoading(false);
        const chatRef = doc(db, "chats", user.uid);
        await setDoc(chatRef, { initialized: true }, { merge: true });

        const messagesRef = collection(chatRef, "messages");

        const q = query(messagesRef, orderBy("timestamp", "asc"));
        const querySnapshot = await getDocs(q);
        const retrievedMessages = querySnapshot.docs.map((doc) => doc.data());
        setMessages(retrievedMessages);
        setDbmessages(retrievedMessages);
        setMessages((messages) => [
          ...messages,
          {
            role: "assistant",
            content: AIreply(),
            timestamp: serverTimestamp(),
          },
        ]);
      } else {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router, language]);

  const user_logout = async () => {
    await logout();
    router.push("/");
  };

  const deleteChatHistory = async (userId) => {
    const messageRef = collection(db, "chats", userId, "messages");
    const querySnapshot = await getDocs(messageRef);
    querySnapshot.forEach(async (docSnapshot) => {
      await deleteDoc(doc(messageRef, docSnapshot.id));
    });
    setMessages(() => [
      {
        role: "assistant",
        content: AIreply(),
        timestamp: serverTimestamp(),
      },
    ]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = async () => {
    const newMessage = {
      role: "user",
      content: message,
      timestamp: serverTimestamp(),
    };

    const assistantMessage = { role: "assistant", content: "" };
    setMessage("");
    setMessages((messages) => [...messages, newMessage, assistantMessage]);
    const user = auth.currentUser;
    const messagesRef = collection(db, "chats", user.uid, "messages");

    try {
      if (!user) {
        throw new Error("User is not logged in");
      }
      await addDoc(messagesRef, newMessage);
      let result = "";

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, newMessage],
          language: language,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const processText = async ({ done, value }) => {
        if (done) {
          return result;
        }
        const text = decoder.decode(value || new Uint8Array(), {
          stream: true,
        });
        result += text;

        setMessages((messages) => {
          const lastMessage = messages[messages.length - 1];
          const otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            {
              ...lastMessage,
              content: lastMessage.content + text,
            },
          ];
        });

        return reader.read().then(processText);
      };

      await reader.read().then(processText);
      const aiMessage = {
        role: "assistant",
        content: result,
        timestamp: serverTimestamp(),
      };
      await addDoc(messagesRef, aiMessage);
    } catch (error) {
      console.error("Error during sendMessage:", error);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress size={50} thickness={4} color="primary" />
      </Box>
    );
  }

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      sx={{
        background: "linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)",
      }}
    >
      <Tooltip title="Logout">
        <IconButton
          onClick={user_logout}
          sx={{
            position: "absolute",
            top: 20,
            right: 20,
            color: "blue",
          }}
        >
          <LogoutIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete Chat History">
        <IconButton
          onClick={() => deleteChatHistory(auth.currentUser.uid)}
          sx={{
            position: "absolute",
            top: 20,
            right: 80,
            color: "red",
          }}
        >
          <DeleteIcon />
        </IconButton>
      </Tooltip>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={4}
        mb={2}
      >
        <Typography variant="h4">Chat with AI 🤖</Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="language-select-label">Language</InputLabel>
          <Select
            labelId="language-select-label"
            id="language-select"
            value={language}
            onChange={handlechange}
            label="Language"
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="es">Español</MenuItem>
            <MenuItem value="ja">Japanese</MenuItem>
            <MenuItem value="fr">French</MenuItem>
            <MenuItem value="Ger">German</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Paper
        elevation={5}
        sx={{
          width: "500px",
          height: "600px",
          display: "flex",
          flexDirection: "column",
          p: 3,
          borderRadius: "20px",
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          sx={{
            maxHeight: "100%",
            padding: "10px",
            "&::-webkit-scrollbar": {
              width: "5px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#888",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: "#555",
            },
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === "assistant" ? "flex-start" : "flex-end"
              }
              alignItems="flex-start"
            >
              {message.role === "assistant" && (
                <Avatar
                  alt="AI"
                  src="./images/AI.avif"
                  sx={{ width: 40, height: 40, marginRight: 2 }}
                />
              )}
              <Box
                sx={{
                  bgcolor:
                    message.role === "assistant"
                      ? "#E0E0E0"
                      : "linear-gradient(135deg, #00F260 10%, #0575E6 100%)",
                  color: message.role === "assistant" ? "#000" : "black",
                  borderRadius: "20px",
                  p: 2,
                  maxWidth: "75%",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  boxShadow:
                    message.role === "assistant"
                      ? "0px 4px 12px rgba(0, 0, 0, 0.1)"
                      : "0px 4px 12px rgba(0, 0, 0, 0.2)",
                }}
              >
                {message.role === "assistant" ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  message.content
                )}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        <Stack
          direction="row"
          spacing={2}
          mt={2}
          sx={{
            alignItems: "center",
          }}
        >
          <TextField
            label="Type a message..."
            variant="outlined"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            sx={{
              backgroundColor: "white",
              borderRadius: "10px",
            }}
          />
          <IconButton
            color="primary"
            onClick={sendMessage}
            sx={{
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)",
            }}
          >
            <SendIcon />
          </IconButton>
        </Stack>
      </Paper>
    </Box>
  );
}
