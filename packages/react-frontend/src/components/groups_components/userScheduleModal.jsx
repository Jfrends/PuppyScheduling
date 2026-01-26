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
} from "@chakra-ui/react";
import PropTypes from "prop-types";
import enUS from "date-fns/locale/en-US";

const locales = {
  "en-US": enUS,
};

const dayNames = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

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
    return (
      dayNames[dayIndex].charAt(0).toUpperCase() + dayNames[dayIndex].slice(1)
    );
  },
};

const formatAmPmFromMinutes = (minutes) => {
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;

  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${mins.toString().padStart(2, "0")} ${period}`;
};

// Map string day name to date within current week
const mapDayToDate = (day) => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const index = dayNames.indexOf(day.toLowerCase());
  return addDays(weekStart, index);
};

function UserScheduleModal({ user, isOpen, onClose }) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);

  if (!user) return null;

  // Normalize events to one week
  const userEvents = user.schedule.map((event) => {
    const baseDate = mapDayToDate(event.day);
    const start = new Date(baseDate);
    start.setHours(0, event.start_time, 0, 0);

    const end = new Date(baseDate);
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

  const referenceDate = startOfWeek(new Date(), { weekStartsOn: 1 });

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
                toolbar={false} // hides navigation
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
                  <strong>Day:</strong>{" "}
                  {selectedEvent.day.charAt(0).toUpperCase() +
                    selectedEvent.day.slice(1)}
                </Text>
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
