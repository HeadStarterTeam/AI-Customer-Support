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
import SendIcon from "@mui/icons-material/Send";
import { useState, useEffect } from "react";
import { logout, auth, db } from "../../firebase";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
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
} from "firebase/firestore";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

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
        setMessages((messages) => [
          ...messages,
          {
            role: "assistant",
            content: "Hello, how can I help you today?",
            timestamp: serverTimestamp(),
          },
        ]);
      } else {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const user_logout = async () => {
    await logout();
    router.push("/");
  };

  const sendMessage = async () => {
    const newMessage = {
      role: "user",
      content: message,
      timestamp: serverTimestamp(),
    };
    const assistantMessage = { role: "assistant", content: "" };

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
        body: JSON.stringify([...messages, newMessage]),
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
    setMessage("");
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Typography variant="h6">Loading...</Typography>
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
            >
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
