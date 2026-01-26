import React, { useState } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import getDay from "date-fns/getDay";
import startOfWeek from "date-fns/startOfWeek";
import addDays from "date-fns/addDays";
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
} from "@chakra-ui/react";
import PropTypes from "prop-types";
import enUS from "date-fns/locale/en-US";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const eventStyleGetter = (event) => ({
  style: {
    backgroundColor: event.can_sit ? "green" : "red",
    borderRadius: "5px",
    opacity: 0.8,
    color: "white",
    border: "0px",
    display: "block",
  },
});

const formatAmPmFromMinutes = (minutes) => {
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${mins.toString().padStart(2, "0")} ${period}`;
};

// Day string like "wednesday" to date in current week
const getDateForDay = (dayString) => {
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const index = days.indexOf(dayString.toLowerCase());
  if (index === -1) return new Date();
  const start = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday start
  return addDays(start, index);
};

function UserScheduleModal({ user, isOpen, onClose, dayToShow }) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);

  if (!user) return null;

  const targetDate = getDateForDay(dayToShow);

  const userEvents = user.schedule
    .filter((e) => e.day.toLowerCase() === dayToShow.toLowerCase())
    .map((event) => {
      const start = new Date(targetDate);
      start.setHours(0, event.start_time, 0, 0);
      const end = new Date(targetDate);
      end.setHours(0, event.end_time, 0, 0);
      return {
        ...event,
        title: event.title || `${event.day} Block`,
        start,
        end,
      };
    });

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  };

  const handleCloseEventDetails = () => {
    setSelectedEvent(null);
    setIsEventDetailsOpen(false);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="6xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {user.name}&apos;s{" "}
            {dayToShow.charAt(0).toUpperCase() + dayToShow.slice(1)} Schedule
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody height="600px">
            {userEvents.length === 0 ? (
              <Text>No events scheduled for {dayToShow}.</Text>
            ) : (
              <Calendar
                localizer={localizer}
                events={userEvents}
                startAccessor="start"
                endAccessor="end"
                defaultView={Views.DAY}
                views={[Views.DAY]}
                defaultDate={targetDate}
                min={new Date(targetDate.setHours(8, 0, 0, 0))}
                max={new Date(targetDate.setHours(22, 0, 0, 0))}
                style={{ height: "100%" }}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                toolbar={false}
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isEventDetailsOpen} onClose={handleCloseEventDetails}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Event Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedEvent && (
              <>
                <Heading size="md" mb={2}>
                  {selectedEvent.title}
                </Heading>
                <Text>
                  <strong>Start Time:</strong>{" "}
                  {formatAmPmFromMinutes(selectedEvent.start_time)}
                </Text>
                <Text>
                  <strong>End Time:</strong>{" "}
                  {formatAmPmFromMinutes(selectedEvent.end_time)}
                </Text>
                <Text>
                  <strong>Location:</strong> {selectedEvent.location}
                </Text>
                <Text>
                  <strong>Status:</strong>{" "}
                  <Text
                    as="span"
                    color={selectedEvent.can_sit ? "green.700" : "red.500"}
                    fontWeight="bold"
                  >
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
    </>
  );
}

UserScheduleModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dayToShow: PropTypes.string.isRequired, // e.g. "wednesday"
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    schedule: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        day: PropTypes.string.isRequired,
        start_time: PropTypes.number.isRequired,
        end_time: PropTypes.number.isRequired,
        location: PropTypes.string,
        can_sit: PropTypes.bool.isRequired,
      }),
    ).isRequired,
  }).isRequired,
};

export default UserScheduleModal;
