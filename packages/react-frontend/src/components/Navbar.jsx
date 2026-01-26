import React, { useContext } from "react";
import { Box, Flex, Button, Link } from "@chakra-ui/react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

function Navbar() {
  const { token, userId, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box bg="green.700" px={4} py={2} color="white">
      <Flex align="center" justify="space-between">
        {/* App name */}
        <Link
          as={RouterLink}
          to="/"
          fontWeight="bold"
          fontSize="lg"
          color="white"
          mr={8}
        >
          Poly Pups
        </Link>

        {/* Nav buttons */}
        <Flex align="center" gap={4}>
          {
            /* if token exixts */ token ? (
              <>
                {/* Schedule button */}
                <Button
                  as={RouterLink}
                  to={`/${userId}/schedule`}
                  variant={pathname.endsWith("schedule") ? "solid" : "ghost"}
                  colorScheme="green"
                  size="md"
                  color="white"
                  _hover={{ bg: "green.600" }}
                >
                  Schedule
                </Button>

                {/* Group button */}
                <Button
                  as={RouterLink}
                  to={`/${userId}/groups`}
                  variant={pathname.endsWith("groups") ? "solid" : "ghost"}
                  colorScheme="green"
                  size="md"
                  color="white"
                  _hover={{ bg: "green.600" }}
                >
                  Groups
                </Button>

                <Button
                  colorScheme="red"
                  variant="outline"
                  size="md"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              /* if no token exists*/
              <Button
                as={RouterLink}
                to="/login"
                variant="ghost"
                colorScheme="green"
                size="md"
                color="white"
                _hover={{ bg: "green.600" }}
              >
                Login
              </Button>
            )
          }
        </Flex>
      </Flex>
    </Box>
  );
}
export default Navbar;
