import React, { useContext } from "react";
import { Flex, Stack, HStack, Heading, Button, Image } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import logo from "../assets/logo.png";
import { AuthContext } from "../contexts/AuthContext";

export default function Landing() {
  const { token, userId } = useContext(AuthContext);

  return (
    <Flex w="100vw" h="100vh" align="center" justify="center">
      <Stack spacing={8} align="center" textAlign="center">
        <Image
          src={logo}
          alt="Paw print logo"
          boxSize="250px"
          objectFit="contain"
        />

        <Heading color="green.700" fontSize={{ base: "5xl", md: "7xl" }}>
          Poly Pups
        </Heading>

        <Heading color="green.700" fontSize={{ base: "4xl", md: "6xl" }}>
          Welcome
        </Heading>

        <HStack spacing={6} justify="center">
          {
            /*if token exists*/ token ? (
              <>
                <Button
                  as={RouterLink}
                  to={`/${userId}/schedule`}
                  colorScheme="green"
                  size="lg"
                >
                  Schedule
                </Button>
                <Button
                  as={RouterLink}
                  to={`/${userId}/groups`}
                  colorScheme="green"
                  size="lg"
                >
                  Groups
                </Button>
              </>
            ) : (
              /* if no token exists */
              <>
                <Button
                  as={RouterLink}
                  to="/login"
                  colorScheme="green"
                  size="lg"
                >
                  Log In
                </Button>
                <Button
                  as={RouterLink}
                  to="/signup"
                  variant="outline"
                  colorScheme="green"
                  size="lg"
                >
                  Sign Up
                </Button>
              </>
            )
          }
        </HStack>
      </Stack>
    </Flex>
  );
}
