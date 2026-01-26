import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  Icon,
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  AccordionItem,
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  Button,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { FaUserCircle } from "react-icons/fa";
import { FaUserGroup } from "react-icons/fa6";
import { AuthContext } from "../../contexts/AuthContext";

function GroupCard({ groupId, isGroupAdmin, onDelete }) {
  const [group, setGroup] = useState();
  const [members, setMembers] = useState();
  const [actionType, setActionType] = useState(""); // "leave" or "delete"
  const cancelRef = useRef();
  const navigate = useNavigate();
  const {
    isOpen: isConfirmOpen,
    onOpen: openConfirm,
    onClose: closeConfirm,
  } = useDisclosure();
  const { userId } = useContext(AuthContext);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;

        const fetchedGroup = await fetch(`${baseUrl}/groups/${groupId}`);

        const groupData = await fetchedGroup.json();

        //console.log("fetched group data", groupData);
        setGroup(groupData);
      } catch (err) {
        console.error("Error fetching group:", err);
      }
    };

    fetchGroup();
  }, [groupId]);

  useEffect(() => {
    if (!group || !group.members) return; // wait for group data

    const fetchMembers = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;

        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found in localStorage");
          return;
        }

        const memberPromises = group.members.map((memberId) =>
          fetch(`${baseUrl}/users/${memberId}?authUserId=${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }).then((res) => {
            if (!res.ok) throw new Error(`Failed to fetch member ${memberId}`);
            return res.json();
          }),
        );

        const membersData = await Promise.all(memberPromises);
        setMembers(membersData);
      } catch (err) {
        console.error("Failed fetching members:", err);
      }
    };

    fetchMembers();
  }, [group]);

  if (!group) {
    return <Text>Loading group...</Text>; // or a spinner
  }

  const handleLeaveGroup = async () => {
    try {
      const token = localStorage.getItem("token");
      const baseUrl = import.meta.env.VITE_API_BASE_URL;

      if (!token || !userId) {
        throw new Error("Missing token or userId");
      }

      // Filter out the leaving user from members list
      const updatedMembers = members.filter((member) => member !== userId);

      // Update group document on the backend
      await fetch(`${baseUrl}/groups/${groupId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ members: updatedMembers }),
      });

      // Get the user
      const response = await fetch(`${baseUrl}/users/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error fetching user");
      }

      const userData = await response.json();
      const updatedGroupsIn = userData.groups_in.filter(
        (group) => group !== groupId,
      );

      // Update user document
      await fetch(`${baseUrl}/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ groups_in: updatedGroupsIn }),
      });

      // Update UI state
      setMembers(updatedMembers);
      closeConfirm();
      window.location.reload();
    } catch (err) {
      console.error("Failed to leave group:", err);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      const token = localStorage.getItem("token");
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const deleteResponse = await fetch(`${baseUrl}/groups/${groupId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        throw new Error(
          `Failed to delete group: ${deleteResponse.status} - ${errorText}`,
        );
      }

      for (const user of members) {
        let uId = user._id;
        const response = await fetch(`${baseUrl}/users/${uId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to delete group:", errorText);
          throw new Error(
            `Failed to delete group: ${response.status} - ${errorText}`,
          );
        }

        const userData = await response.json();
        if (group.admins.includes(uId)) {
          const updatedGroupsCreated = userData.groups_created.filter(
            (g) => g !== groupId,
          );

          // Update user document
          await fetch(`${baseUrl}/users/${uId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ groups_created: updatedGroupsCreated }),
          });
        } else {
          console.log(user);
          const updatedGroupsIn = userData.groups_in.filter(
            (g) => g !== groupId,
          );

          // Update user document
          await fetch(`${baseUrl}/users/${uId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ groups_in: updatedGroupsIn }),
          });
        }
      }

      closeConfirm();
      if (onDelete) {
        onDelete(groupId); // notify parent to remove this group card
      }
    } catch (err) {
      console.error("Failed to delete group:", err);
    }
  };

  const listMembers = (members) => {
    return members.map((member, idx) => {
      return <p key={idx}>{member.name}</p>;
    });
  };

  return (
    <Card w="md" variant={"outline"} bg={"green.100"}>
      <AlertDialog
        isOpen={isConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={closeConfirm}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {actionType === "delete" ? "Delete Group" : "Leave Group"}
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to {actionType} this group? This action
              cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={closeConfirm}>
                Cancel
              </Button>
              <Button
                colorScheme={actionType === "delete" ? "red" : "orange"}
                onClick={
                  actionType === "delete" ? handleDeleteGroup : handleLeaveGroup
                }
                ml={3}
              >
                {actionType === "delete" ? "Delete" : "Leave"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <CardBody>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5em",
            paddingBottom: "0.5em",
          }}
        >
          <Icon as={FaUserGroup} boxSize={"1.5em"} alignContent={"center"} />
          <Heading size="md" mb={1}>
            {group.name}
          </Heading>
        </div>
        <Text>{group.description}</Text>
        <Accordion
          allowToggle
          variant={"subtle"}
          m={"0.5em"}
          bg="green.200"
          borderRadius={"md"}
          border={"transparent"}
        >
          <AccordionItem>
            <AccordionButton gap={2} alignItems={"center"}>
              <Icon as={FaUserCircle} boxSize={5} />
              <Text flex={1} textAlign={"left"}>
                Members
              </Text>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              {members ? listMembers(members) : <Text>Loading members...</Text>}
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
        {isGroupAdmin && (
          <Text fontSize="sm" color="gray.600">
            Group ID: {groupId}
          </Text>
        )}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mt={4}
        >
          <Button
            colorScheme={isGroupAdmin ? "red" : "orange"}
            size="sm"
            variant="ghost"
            onClick={() => {
              setActionType(isGroupAdmin ? "delete" : "leave");
              openConfirm();
            }}
          >
            {isGroupAdmin ? "Delete" : "Leave"}
          </Button>

          {isGroupAdmin && (
            <Button
              colorScheme="blue"
              color="white"
              size="sm"
              onClick={() => navigate(`/${userId}/groups/${groupId}`)}
            >
              Manage Group
            </Button>
          )}
        </Box>
      </CardBody>
    </Card>
  );
}

GroupCard.propTypes = {
  groupId: PropTypes.string.isRequired,
  isGroupAdmin: PropTypes.bool,
  onDelete: PropTypes.func,
};

export default GroupCard;
