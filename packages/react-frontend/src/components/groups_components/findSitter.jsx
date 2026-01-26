import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
} from "@chakra-ui/react";
import React, { useState } from "react";
import PropTypes from "prop-types";

const FindSitter = ({ onSubmit }) => {
  const [day, setDay] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(day, startTime, endTime);
  };

  return (
    <Box p={4} borderWidth={1} borderRadius="lg" maxW="md" mx="auto">
      <form onSubmit={handleSubmit}>
        <FormControl mb={4} isRequired>
          <FormLabel>Day of the Week</FormLabel>
          <Select
            placeholder="Select day"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          >
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
          </Select>
        </FormControl>

        <FormControl mb={4} isRequired>
          <FormLabel>Start Time</FormLabel>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </FormControl>

        <FormControl mb={4} isRequired>
          <FormLabel>End Time</FormLabel>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </FormControl>

        <Button colorScheme="green" type="submit" width="full">
          Submit
        </Button>
      </form>
    </Box>
  );
};

FindSitter.propTypes = {
  onSubmit: PropTypes.func.isRequired, // or PropTypes.func if not required
};

export default FindSitter;
