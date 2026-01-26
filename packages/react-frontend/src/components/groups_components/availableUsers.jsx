import React, { useState } from "react";
import { Table, Thead, Tbody, Tr, Th, Td, Button } from "@chakra-ui/react";
import UserScheduleDayModal from "./userScheduleDayModal";
import PropTypes from "prop-types";

const AvailableUsers = ({ users, day }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const openModal = (user) => {
    setSelectedUser(user);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedUser(null);
  };

  return (
    <>
      <Table variant="simple" size="md" mt={4}>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>View Schedule</Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.map((user, index) => (
            <Tr key={user.email || index}>
              <Td>{user.name}</Td>
              <Td>{user.email}</Td>
              <Td>
                <Button
                  colorScheme="blue"
                  size="sm"
                  onClick={() => openModal(user)}
                >
                  Schedule
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {selectedUser && (
        <UserScheduleDayModal
          user={selectedUser}
          isOpen={isOpen}
          onClose={closeModal}
          dayToShow={day}
        />
      )}
    </>
  );
};

AvailableUsers.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      // Add more fields here if needed
    }),
  ).isRequired,
  day: PropTypes.string.isRequired,
};

export default AvailableUsers;
