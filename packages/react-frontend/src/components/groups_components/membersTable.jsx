import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from "@chakra-ui/react";
import PropTypes from "prop-types";
import React, { useRef, useState } from "react";
import UserScheduleModal from "./userScheduleModal";

const MembersTable = ({ memberData, removeMember }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();
  const [selectedIndex, setSelectedIndex] = useState(null);

  const [isOpenMod, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const openModal = (user) => {
    setSelectedUser(user);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedUser(null);
  };

  const handleOpenDialog = (index) => {
    setSelectedIndex(index);
    onOpen();
  };

  const handleConfirmRemove = () => {
    if (selectedIndex !== null) {
      removeMember(selectedIndex);
      onClose();
      setSelectedIndex(null);
    }
  };

  return (
    <>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>View Schedule</Th>
            <Th>Remove</Th>
          </Tr>
        </Thead>
        <Tbody>
          {memberData.map((member, index) => (
            <Tr key={member._id}>
              <Td>{member.name}</Td>
              <Td>{member.email}</Td>
              <Td>
                <Button
                  colorScheme="blue"
                  size="sm"
                  onClick={() => openModal(member)}
                >
                  Schedule
                </Button>
              </Td>
              <Td>
                <Button
                  colorScheme="red"
                  onClick={() => handleOpenDialog(index)}
                  size="sm"
                >
                  Remove
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <UserScheduleModal
        user={selectedUser}
        isOpen={isOpenMod}
        onClose={closeModal}
      />

      {/* Chakra AlertDialog rendered outside the table */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove Member
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to remove{" "}
              <strong>{memberData[selectedIndex]?.name}</strong> from this
              group?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleConfirmRemove} ml={3}>
                Remove
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

MembersTable.propTypes = {
  memberData: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
    }),
  ).isRequired,
  removeMember: PropTypes.func.isRequired,
};

export default MembersTable;
