import React from "react";
import { useState } from "react";
import {
  Flex,
  Heading,
  Input,
  Button,
  InputGroup,
  Stack,
  InputLeftElement,
  chakra,
  Box,
  Link,
  Avatar,
  FormControl,
  InputRightElement,
  Text,
} from "@chakra-ui/react";
import { FaUserAlt, FaLock } from "react-icons/fa";

import { useNavigate } from "react-router-dom";

import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

const CFaUserAlt = chakra(FaUserAlt);
const CFaLock = chakra(FaLock);

function Login() {
  const navigate = useNavigate();

  const { login } = useContext(AuthContext);

  const [showPassword, setShowPassword] = useState(false);

  const handleShowClick = () => setShowPassword(!showPassword);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(""); // Clear any previous error messages
    setSuccessMessage(""); // Clear any previous success messages

    const formattedData = {
      email: formData.email,
      password: formData.password,
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formattedData),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to login");
      }

      const data = await response.json();
      login(data.token);
      console.log("User logged in successfully:", data);

      // Display success message
      setSuccessMessage("User logged in successfully!");

      // Clear the form on success
      setFormData({
        email: "",
        password: "",
      });

      // navigate to users schedule
      const { sub: userId } = JSON.parse(atob(data.token.split(".")[1]));
      navigate(`/${userId}/schedule`);
    } catch (error) {
      console.error("Error during log in:", error);
      setErrorMessage(error.message || "An error occurred during log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex
      flexDirection="column"
      width="100wh"
      height="100vh"
      backgroundColor="gray.200"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        flexDir="column"
        mb="2"
        justifyContent="center"
        alignItems="center"
      >
        <Avatar bg="green.700" />
        <Heading color="green.700">Welcome</Heading>
        <Box minW={{ base: "90%", md: "468px" }}>
          <form onSubmit={handleSubmit}>
            <Stack
              spacing={4}
              p="1rem"
              backgroundColor="whiteAlpha.900"
              boxShadow="md"
            >
              <FormControl>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <CFaUserAlt color="gray.300" />
                  </InputLeftElement>

                  <Input
                    type="email"
                    placeholder="email address"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </InputGroup>
              </FormControl>
              <FormControl>
                <InputGroup>
                  <InputLeftElement pointerEvents="none" color="gray.300">
                    <CFaLock color="gray.300" />
                  </InputLeftElement>{" "}
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <InputRightElement width="4.5rem">
                    <Button h="1.75rem" size="sm" onClick={handleShowClick}>
                      {showPassword ? "Hide" : "Show"}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              {/* Display error message */}
              {errorMessage && (
                <Text color="red.500" textAlign="center">
                  {errorMessage}
                </Text>
              )}

              {/* Display success message */}
              {successMessage && (
                <Text color="green.500" textAlign="center">
                  {successMessage}
                </Text>
              )}

              <Button
                borderRadius={0}
                type="submit"
                variant="solid"
                backgroundColor="green.700"
                color="white"
                width="full"
                isLoading={loading}
              >
                Login
              </Button>
            </Stack>
          </form>
        </Box>
      </Stack>
      <Box>
        New to us?{" "}
        <Link color="green.700" href="/signup">
          Sign Up
        </Link>
      </Box>
    </Flex>
  );
}

export default Login;
