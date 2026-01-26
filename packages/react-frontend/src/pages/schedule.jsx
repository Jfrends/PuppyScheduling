import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import getDay from "date-fns/getDay";
import addDays from "date-fns/addDays";
import startOfDay from "date-fns/startOfDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  Box,
  Heading,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  useDisclosure,
  Text,
  Switch,
} from "@chakra-ui/react";

import enUS from "date-fns/locale/en-US";

const locales = {
  "en-US": enUS,
};

const customStartOfWeek = (date) => {
  return addDays(startOfDay(date), -date.getDay() + 1); // Monday = 1, so -1+1=0 offset
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: customStartOfWeek,
  getDay,
  locales,
});

const dayNames = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const dayToIndex = (day) => {
  return dayNames.indexOf(day.toLowerCase());
};

// Helper function to convert minutes since midnight to Date object
const minutesToDate = (day, minutes) => {
  const dayIndex = typeof day === "string" ? dayToIndex(day) : day;

  // Get the most recent previous Monday (or this Monday if today is Monday)
  const today = new Date();
  const todayDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  let daysToSubtract;
  if (todayDayOfWeek === 0) {
    // If today is Sunday
    daysToSubtract = 6; // Go back to previous Monday
  } else {
    // Any other day
    daysToSubtract = todayDayOfWeek - 1; // Go back to most recent Monday
  }

  const mostRecentMonday = new Date(today);
  mostRecentMonday.setDate(today.getDate() - daysToSubtract);
  mostRecentMonday.setHours(0, 0, 0, 0); // Reset to start of day

  // Calculate the target day
  const dayDate = addDays(mostRecentMonday, dayIndex);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return new Date(dayDate.setHours(hours, mins, 0, 0));
};

const initialEvents = [
  {
    id: 1,
    title: "CS 307 Lecture",
    day: "monday",
    start_time: 600, // 10:00 AM
    end_time: 710, // 11:50 AM
    location: "Building 14, Room 232",
    can_sit: true,
    // Converted properties for the calendar component
    start: minutesToDate("monday", 600),
    end: minutesToDate("monday", 710),
  },
  {
    id: 2,
    title: "Study Group",
    day: "tuesday",
    start_time: 840, // 2:00 PM
    end_time: 930, // 3:30 PM
    location: "Library, Study Room 3",
    can_sit: false,
    start: minutesToDate("tuesday", 840),
    end: minutesToDate("tuesday", 930),
  },
  {
    id: 3,
    title: "Gym Workout",
    day: "wednesday",
    start_time: 1080, // 6:00 PM
    end_time: 1140, // 7:00 PM
    location: "Recreation Center",
    can_sit: true,
    start: minutesToDate("wednesday", 1080),
    end: minutesToDate("wednesday", 1140),
  },
  {
    id: 4,
    title: "Weekend Hike",
    day: "saturday",
    start_time: 600, // 10:00 AM
    end_time: 780, // 1:00 PM
    location: "Mountain Trail",
    can_sit: false,
    start: minutesToDate("saturday", 600),
    end: minutesToDate("saturday", 780),
  },
];

function Schedule() {
  const [events, setEvents] = useState(initialEvents);
  const [newEvent, setNewEvent] = useState({
    id: null,
    title: "",
    day: "monday",
    start_time: 540,
    end_time: 600,
    location: "",
    can_sit: true,
    start: null,
    end: null,
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEventDetailsOpen,
    onOpen: onEventDetailsOpen,
    onClose: onEventDetailsClose,
  } = useDisclosure();

  // user id
  const { userId } = useParams();
  // loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add this near the top of your Schedule function
  useEffect(() => {
    // Calculate and log the start of the current week
    const today = new Date();
    const startOfWeek = customStartOfWeek(today);

    console.log("Calendar week starts on:", startOfWeek.toDateString());

    // Log each day of the week to help with debugging
    const weekDays = dayNames.map((day, index) => {
      const date = addDays(startOfWeek, index);
      return {
        day: day,
        date: date.toDateString(),
        isoDate: date.toISOString(),
      };
    });

    console.log("Full week dates:", weekDays);

    // Example event date calculations
    const exampleEventTime = 600; // 10:00 AM
    const exampleDate = minutesToDate("monday", exampleEventTime);
    console.log(
      "Example event on Monday at 10:00 AM:",
      exampleDate.toDateString(),
      exampleDate.toTimeString(),
    );
  }, []);

  // Fetch events when component mounts
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);

        // Get auth token from localStorage
        const token = localStorage.getItem("token");

        const baseUrl = import.meta.env.VITE_API_BASE_URL;

        if (!token) {
          setError("Authentication required");
          setLoading(false);
          return;
        }

        // Fetch events from the backend
        const response = await fetch(
          `${baseUrl}/users/${userId}/events?authUserId=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }

        const data = await response.json();

        // Transform backend data to the format calendar expects
        const transformedEvents = data.map((event, index) => ({
          id: event._id || `event-${Date.now()}-${index}`,
          title: event.title,
          day: event.day,
          start_time: event.start_time,
          end_time: event.end_time,
          location: event.location,
          can_sit: event.can_sit,
          start: minutesToDate(event.day, event.start_time),
          end: minutesToDate(event.day, event.end_time),
        }));

        console.log("Fetched events:", transformedEvents);

        setEvents(transformedEvents);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [userId]); // Re-fetch when userId changes

  const handleAddEvent = () => {
    const defaultStart = 540; // 9:00 AM
    const defaultEnd = 600; // 10:00 AM

    setNewEvent({
      id: Date.now(),
      title: "",
      day: "monday",
      start_time: defaultStart,
      end_time: defaultEnd,
      location: "",
      can_sit: true,
      start: minutesToDate("monday", defaultStart),
      end: minutesToDate("monday", defaultEnd),
    });
    setIsEditMode(false);
    onOpen();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent({
      ...newEvent,
      [name]: value,
    });
  };

  const handleCanSitToggle = () => {
    setNewEvent((prev) => ({
      ...prev,
      can_sit: !prev.can_sit,
    }));
  };

  const handleDayChange = (e) => {
    const day = e.target.value;

    setNewEvent((prev) => {
      const updated = {
        ...prev,
        day,
        start: minutesToDate(day, prev.start_time),
        end: minutesToDate(day, prev.end_time),
      };
      return updated;
    });
  };

  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    const [hours, minutes] = value.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;

    setNewEvent((prev) => {
      const updated = { ...prev };

      if (name === "startTime") {
        updated.start_time = totalMinutes;
        updated.start = minutesToDate(prev.day, totalMinutes);
      } else if (name === "endTime") {
        updated.end_time = totalMinutes;
        updated.end = minutesToDate(prev.day, totalMinutes);
      }

      return updated;
    });
  };

  const formatTimeFromMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const formatAmPmFromMinutes = (minutes) => {
    const hours24 = Math.floor(minutes / 60);
    const mins = minutes % 60;

    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 || 12; // Converts 0 to 12 for 12 AM

    return `${hours12}:${mins.toString().padStart(2, "0")} ${period}`;
  };

  const [isEditMode, setIsEditMode] = useState(false);

  const handleEditEvent = () => {
    setNewEvent({
      ...selectedEvent,
    });
    setIsEditMode(true);
    onEventDetailsClose();
    onOpen();
  };

  const handleSaveEvent = async () => {
    console.log("Saving event:", newEvent);
    console.log("Is Edit Mode:", isEditMode);

    if (
      newEvent.title &&
      newEvent.day &&
      newEvent.start_time &&
      newEvent.end_time &&
      newEvent.location &&
      newEvent.can_sit !== undefined
    ) {
      try {
        const token = localStorage.getItem("token");
        const baseUrl = import.meta.env.VITE_API_BASE_URL;

        if (!token) {
          alert("Authentication required. Please log in again.");
          return;
        }

        // Prepare event data for the backend
        const eventData = {
          title: newEvent.title,
          day: newEvent.day,
          start_time: parseInt(newEvent.start_time),
          end_time: parseInt(newEvent.end_time),
          location: newEvent.location,
          can_sit: newEvent.can_sit,
        };

        console.log("Sending event data to backend:", eventData);

        // if edit mode, delete the old event first
        if (isEditMode) {
          console.log("Deleting old event:", newEvent.id);

          const deleteResponse = await fetch(
            `${baseUrl}/users/${userId}/events/${newEvent.id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            },
          );

          if (!deleteResponse.ok) {
            const errorText = await deleteResponse.text();
            console.error("Error deleting old event:", errorText);
            throw new Error(
              `Failed to delete old event: ${deleteResponse.status}`,
            );
          }

          console.log("Old event deleted successfully");
        }

        // Create new event
        const response = await fetch(`${baseUrl}/users/${userId}/events`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        });

        console.log("Backend response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Backend error:", errorText);
          throw new Error(`Failed to create event: ${response.status}`);
        }

        const savedEvent = await response.json();
        console.log(
          `Event ${isEditMode ? "updated" : "created"} successfully:`,
          savedEvent,
        );

        // Transform the saved event for the calendar
        const calendarEvent = {
          id: savedEvent._id || savedEvent.id,
          title: savedEvent.title,
          day: savedEvent.day,
          start_time: savedEvent.start_time,
          end_time: savedEvent.end_time,
          location: savedEvent.location,
          can_sit: savedEvent.can_sit,
          start: minutesToDate(savedEvent.day, savedEvent.start_time),
          end: minutesToDate(savedEvent.day, savedEvent.end_time),
        };

        let updatedEvents;
        if (isEditMode) {
          // Remove the old event and add the new one
          updatedEvents = events.filter((event) => event.id !== newEvent.id);
          updatedEvents = [...updatedEvents, calendarEvent];
          setIsEditMode(false);
        } else {
          // Just add the new event
          updatedEvents = [...events, calendarEvent];
        }

        setEvents(updatedEvents);
        console.log("Updated Events:", updatedEvents);

        onClose(); // Close modal

        // Show success message
        //alert(`Event ${isEditMode ? "updated" : "created"} successfully!`);
      } catch (error) {
        console.error(
          `Error ${isEditMode ? "updating" : "creating"} event:`,
          error,
        );
        alert(
          `Error ${isEditMode ? "updating" : "creating"} event: ${error.message}`,
        );
      }
    } else {
      alert("Please fill in all fields");
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    onEventDetailsOpen();
  };

  const handleRemoveEvent = async () => {
    try {
      const token = localStorage.getItem("token");
      const baseUrl = import.meta.env.VITE_API_BASE_URL;

      if (!token) {
        alert("Authentication required. Please log in again.");
        return;
      }

      console.log("Deleting event:", selectedEvent.id);

      // Call backend to delete the event
      const response = await fetch(
        `${baseUrl}/users/${userId}/events/${selectedEvent.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Delete response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend error:", errorText);
        throw new Error(`Failed to delete event: ${response.status}`);
      }

      // Remove from local state after successful backend deletion
      const updatedEvents = events.filter((e) => e.id !== selectedEvent.id);
      setEvents(updatedEvents);

      console.log("Event deleted successfully, updated events:", updatedEvents);

      onEventDetailsClose();
      alert("Event deleted successfully!");
    } catch (error) {
      console.error("Error deleting event:", error);
      alert(`Error deleting event: ${error.message}`);
    }
  };

  const eventStyleGetter = (event) => {
    const backgroundColor = event.can_sit ? "green" : "red";

    const style = {
      backgroundColor,
      borderRadius: "5px",
      opacity: 0.8,
      color: "white",
      border: "0px",
      display: "block",
    };
    return {
      style,
    };
  };

  const formats = {
    dayFormat: (date) => {
      const jsDay = date.getDay();
      const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
      return (
        dayNames[dayIndex].charAt(0).toUpperCase() + dayNames[dayIndex].slice(1)
      );
    },
  };

  return (
    <Box p={5}>
      <Heading mb={4}>Weekly Schedule</Heading>

      {error && (
        <Box mb={4} p={3} bg="red.100" color="red.700" borderRadius="md">
          {error}
        </Box>
      )}

      <Button colorScheme="green" onClick={handleAddEvent} mb={4}>
        Add New Event
      </Button>
      <Box
        height="600px"
        backgroundColor="white"
        boxShadow="md"
        borderRadius="md"
        p={2}
      >
        {loading ? (
          <Box
            height="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text>Loading events...</Text>
          </Box>
        ) : (
          (console.log("Events being passed to Calendar:", events),
          (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              views={["week"]}
              view="week"
              formats={formats}
              defaultView="week"
              min={minutesToDate("monday", 480)}
              max={minutesToDate("monday", 1320)}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              components={{
                toolbar: CustomToolbar,
              }}
            />
          ))
        )}
      </Box>

      {/* Modal for adding new events */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isEditMode ? "Edit Event" : "Add New Event"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={3} isRequired>
              <FormLabel>Event Title</FormLabel>
              <Input
                name="title"
                value={newEvent.title}
                onChange={handleInputChange}
                placeholder="Enter event title"
              />
            </FormControl>

            <FormControl mb={3} isRequired>
              <FormLabel>Day</FormLabel>
              <Select
                name="day"
                value={newEvent.day}
                onChange={handleDayChange}
              >
                {dayNames.map((day, index) => (
                  <option key={index} value={day}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl mb={3} isRequired>
              <FormLabel>Start Time</FormLabel>
              <Input
                name="startTime"
                type="time"
                onChange={handleTimeChange}
                value={formatTimeFromMinutes(newEvent.start_time)}
              />
            </FormControl>

            <FormControl mb={3} isRequired>
              <FormLabel>End Time</FormLabel>
              <Input
                name="endTime"
                type="time"
                onChange={handleTimeChange}
                value={formatTimeFromMinutes(newEvent.end_time)}
              />
            </FormControl>

            <FormControl mb={3} isRequired>
              <FormLabel>Location</FormLabel>
              <Input
                name="location"
                value={newEvent.location}
                onChange={handleInputChange}
                placeholder="Enter location"
              />
            </FormControl>

            <FormControl mb={3} display="flex" alignItems="center" isRequired>
              <FormLabel mb="0">Can Sit?</FormLabel>
              <Switch
                isChecked={newEvent.can_sit}
                onChange={handleCanSitToggle}
                colorScheme={newEvent.can_sit ? "green" : "red"}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSaveEvent}>
              Save
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal for event details */}
      <Modal isOpen={isEventDetailsOpen} onClose={onEventDetailsClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Event Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedEvent && (
              <>
                <Heading size="md">{selectedEvent.title}</Heading>
                <Box mt={2}>
                  <strong>Day:</strong>{" "}
                  {selectedEvent.day.charAt(0).toUpperCase() +
                    selectedEvent.day.slice(1)}
                </Box>
                <Box>
                  <strong>Start Time:</strong>{" "}
                  {formatAmPmFromMinutes(selectedEvent.start_time)}
                </Box>
                <Box>
                  <strong>End Time:</strong>{" "}
                  {formatAmPmFromMinutes(selectedEvent.end_time)}
                </Box>
                <Box>
                  <strong>Location:</strong> {selectedEvent.location}
                </Box>
                <Box>
                  <strong>Status:</strong>{" "}
                  <Text
                    as="span"
                    color={selectedEvent.can_sit ? "green.700" : "red.500"}
                    fontWeight="bold"
                  >
                    {selectedEvent.can_sit ? "Can Sit" : "Cannot Sit"}
                  </Text>
                </Box>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleEditEvent}>
              Edit Event
            </Button>
            <Button colorScheme="red" mr={3} onClick={handleRemoveEvent}>
              Remove Event
            </Button>
            <Button variant="ghost" onClick={onEventDetailsClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

const CustomToolbar = () => {
  return (
    <Box display="flex" justifyContent="center" mb={4}>
      <Text fontWeight="bold">Weekly Schedule</Text>
    </Box>
  );
};

export default Schedule;
