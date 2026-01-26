import React, { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import getDay from "date-fns/getDay";
import addDays from "date-fns/addDays";
import startOfWeek from "date-fns/startOfWeek";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Heading,
  Text,
  Checkbox,
  CheckboxGroup,
  Stack,
  FormLabel,
  FormControl,
  Input,
  Switch,
} from "@chakra-ui/react";
import PropTypes from "prop-types";
import enUS from "date-fns/locale/en-US";

const locales = { "en-US": enUS };
const dayNames = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const eventStyleGetter = (event) => {
  const backgroundColor = event.can_sit ? "green" : "red";
  return {
    style: {
      backgroundColor,
      borderRadius: "5px",
      opacity: 0.8,
      color: "white",
      border: "0px",
      display: "block",
    },
  };
};

const formats = {
  dayFormat: (date) => {
    const jsDay = date.getDay();
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
    return dayNames[dayIndex].charAt(0).toUpperCase() + dayNames[dayIndex].slice(1);
  },
};

const formatAmPmFromMinutes = (minutes) => {
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${mins.toString().padStart(2, "0")} ${period}`;
};

const mapDayToDate = (day) => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const index = dayNames.indexOf(day.toLowerCase());
  return addDays(weekStart, index);
};

function UserScheduleModal({ user, isOpen, onClose }) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: "",
    days: [],
    start_time: 480,
    end_time: 540,
    location: "",
    can_sit: true,
  });

  if (!user) return null;

  // Expand multi-day events for calendar
  const userEvents = user.schedule.flatMap((event) => {
    const days = event.days || [event.day];
    return days.map((day) => {
      const baseDate = mapDayToDate(day);
      const start = new Date(baseDate);
      start.setHours(0, event.start_time, 0, 0);
      const end = new Date(baseDate);
      end.setHours(0, event.end_time, 0, 0);

      return { ...event, day, start, end };
    });
  });

  const referenceDate = startOfWeek(new Date(), { weekStartsOn: 1 });

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  };

  const handleCloseEventDetails = () => {
    setSelectedEvent(null);
    setIsEventDetailsOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({ ...prev, [name]: value }));
  };

  const handleCanSitToggle = () => {
    setNewEvent((prev) => ({ ...prev, can_sit: !prev.can_sit }));
  };

  const handleDaysChange = (days) => {
    setNewEvent((prev) => ({ ...prev, days }));
  };

  const handleAddEvent = () => {
    if (!newEvent.title || newEvent.days.length === 0 || !newEvent.location) {
      alert("Please fill in all fields and select at least one day.");
      return;
    }

    const addedEvents = newEvent.days.map((day) => {
      const baseDate = mapDayToDate(day);
      const start = new Date(baseDate);
      start.setHours(0, newEvent.start_time, 0, 0);
      const end = new Date(baseDate);
      end.setHours(0, newEvent.end_time, 0, 0);

      return { ...newEvent, day, start, end };
    });

    user.schedule.push(...addedEvents);

    setNewEvent({ title: "", days: [], start_time: 480, end_time: 540, location: "", can_sit: true });
    setIsAddEventOpen(false);
  };

  return (
    <>
      {/* Main Schedule Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{user.name}&apos;s Schedule</ModalHeader>
          <ModalCloseButton />
          <ModalBody height="600px">
            {userEvents.length === 0 ? (
              <Text>No events scheduled.</Text>
            ) : (
              <Calendar
                localizer={localizer}
                events={userEvents}
                startAccessor="start"
                endAccessor="end"
                defaultView="week"
                views={["week"]}
                defaultDate={referenceDate}
                min={new Date(referenceDate.setHours(8, 0, 0, 0))}
                max={new Date(referenceDate.setHours(22, 0, 0, 0))}
                style={{ height: "100%" }}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                formats={formats}
                toolbar={false}
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setIsAddEventOpen(true)} colorScheme="green" mr={3}>
              Add Event
            </Button>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Event Details Modal */}
      <Modal isOpen={isEventDetailsOpen} onClose={handleCloseEventDetails}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Event Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedEvent && (
              <>
                <Heading size="md" mb={2}>{selectedEvent.title}</Heading>
                <Text><strong>Day:</strong> {selectedEvent.day.charAt(0).toUpperCase() + selectedEvent.day.slice(1)}</Text>
                <Text><strong>Start Time:</strong> {formatAmPmFromMinutes(selectedEvent.start_time)}</Text>
                <Text><strong>End Time:</strong> {formatAmPmFromMinutes(selectedEvent.end_time)}</Text>
                <Text><strong>Location:</strong> {selectedEvent.location}</Text>
                <Text>
                  <strong>Status:</strong>{" "}
                  <Text as="span" color={selectedEvent.can_sit ? "green.700" : "red.500"} fontWeight="bold">
                    {selectedEvent.can_sit ? "Can Sit" : "Cannot Sit"}
                  </Text>
                </Text>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleCloseEventDetails}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Event Modal */}
      <Modal isOpen={isAddEventOpen} onClose={() => setIsAddEventOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Event</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={3}>
              <FormLabel>Title</FormLabel>
              <Input name="title" value={newEvent.title} onChange={handleInputChange} placeholder="Event Title" />
            </FormControl>

            <FormControl mb={3}>
              <FormLabel>Select Days</FormLabel>
              <CheckboxGroup value={newEvent.days} onChange={handleDaysChange}>
                <Stack spacing={2} direction="row">
                  {dayNames.map((day) => (
                    <Checkbox key={day} value={day}>
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </Checkbox>
                  ))}
                </Stack>
              </CheckboxGroup>
            </FormControl>

            <FormControl mb={3}>
              <FormLabel>Start Time (minutes since midnight)</FormLabel>
              <Input name="start_time" type="number" value={newEvent.start_time} onChange={handleInputChange} />
            </FormControl>

            <FormControl mb={3}>
              <FormLabel>End Time (minutes since midnight)</FormLabel>
              <Input name="end_time" type="number" value={newEvent.end_time} onChange={handleInputChange} />
            </FormControl>

            <FormControl mb={3}>
              <FormLabel>Location</FormLabel>
              <Input name="location" value={newEvent.location} onChange={handleInputChange} placeholder="Location" />
            </FormControl>

            <FormControl display="flex" alignItems="center" mb={3}>
              <FormLabel mb="0">Can Sit?</FormLabel>
              <Switch isChecked={newEvent.can_sit} onChange={handleCanSitToggle} colorScheme={newEvent.can_sit ? "green" : "red"} />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleAddEvent}>
              Add Event
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

UserScheduleModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    schedule: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        day: PropTypes.string,
        days: PropTypes.arrayOf(PropTypes.string),
        start_time: PropTypes.number.isRequired,
        end_time: PropTypes.number.isRequired,
        location: PropTypes.string,
        can_sit: PropTypes.bool.isRequired,
      })
    ).isRequired,
  }).isRequired,
};

export default UserScheduleModal;
