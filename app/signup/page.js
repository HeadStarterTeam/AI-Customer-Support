"use client";

import React, { useState } from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useRouter } from "next/navigation"; // Import useRouter
import { signUpWithEmail } from "../../firebase";
import Alert from "@mui/material/Alert";
import { signInWithGoogle, logout, auth } from "../../firebase";
import { Google as GoogleIcon } from "@mui/icons-material";
import { RedirectType } from "next/navigation";

const defaultTheme = createTheme();

export default function SignUp() {
  const [error, setError] = useState(null);
  const router = useRouter(); // Initialize useRouter

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get("email");
    const password = data.get("password");
    const firstName = data.get("firstName");
    const lastName = data.get("lastName");

    try {
      await signUpWithEmail(email, password);
      console.log({
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
      });
      alert("User created successfully!");
      router.push("/dashboard");
    } catch (error) {
      setError(error.message);
    }
  };

  const goback = () => {
    router.push("/");
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      alert("User signed in successfully!");
      await logout();
      router.push("/");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}></Avatar>
          <Typography component="h1" variant="h5">
            Sign up
          </Typography>
          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit}
            sx={{ mt: 3 }}
          >
            {error && (
              <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoComplete="given-name"
                  name="firstName"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox value="allowExtraEmails" color="primary" />
                  }
                  label="By clicking 'Sign Up', you agree to our Terms of Service and Privacy Policy."
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign Up
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link onClick={goback} variant="body2">
                  Already have an account? Sign in
                </Link>
              </Grid>
            </Grid>
            <Button
              fullWidth
              variant="outlined"
              sx={{
                mt: 1,
                mb: 2,
                borderColor: "black",
                color: "black",
                backgroundColor: "transparent",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                  borderColor: "black",
                },
              }}
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignIn}
            >
              Continue with Google
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
