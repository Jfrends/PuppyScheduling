import React, { useState, useEffect } from "react";
import MembersTable from "../components/groups_components/membersTable";
import FindSitter from "../components/groups_components/findSitter";
import { useParams } from "react-router-dom";
import { Heading } from "@chakra-ui/react";
import AvailableUsers from "../components/groups_components/availableUsers";

function ManageGroup() {
  const { userId, groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState(null);
  const [result, setResult] = useState(null);
  const token = localStorage.getItem("token");
  useEffect(() => {
    async function fetchGroup() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/groups/${groupId}`,
        );
        if (!response.ok)
          throw new Error(`Failed to fetch group: ${response.status}`);
        const data = await response.json();
        setGroup(data);
        const memberFetches = data.members.map((id) =>
          fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }).then((res) => res.json()),
        );
        const fullMembers = await Promise.all(memberFetches);
        setMembers(fullMembers);
      } catch (err) {
        setError(err.message);
        console.log(error);
      } finally {
        setLoading(false);
      }
    }
    fetchGroup();
  }, [groupId]);
  if (loading) {
    return <p>Loading...</p>;
  }
  if (!group.admins.some((admin) => admin.toString() === userId)) {
    return (
      <p>
        You do not have permission to view this page because you are not an
        admin.
      </p>
    );
  }

  function removeOneMember(index) {
    const userToRemove = members[index];
    let listOfGroups = userToRemove.groups_in;
    const updatedGroupList = listOfGroups.filter((gid) => gid !== groupId);
    const updatedUser = { ...userToRemove, groups_in: updatedGroupList };
    const userUrl =
      `${import.meta.env.VITE_API_BASE_URL}/users/` + userToRemove._id;
    fetch(userUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedUser),
    }).catch((err) => {
      console.log(err);
    });
    const updatedMembers = members.filter((_, i) => i !== index);
    const groupUrl = `${import.meta.env.VITE_API_BASE_URL}/groups/` + groupId;
    const updatedGroup = { ...group, members: updatedMembers };
    listOfGroups = userToRemove.groups_in;
    fetch(groupUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedGroup),
    })
      .then((res) => {
        if (res.status === 200) {
          setMembers([...updatedMembers]);
        } else {
          console.error(
            "Request status not OK, instead server gave ",
            res.status,
          );
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function handleTimeSubmit(day, startTime, endTime) {
    console.log("Received from form:", day, startTime, endTime);
    const dayOfWeek = day.toLowerCase();
    const startSplit = startTime.split(":");
    const endSplit = endTime.split(":");
    const startMPM =
      parseInt(startSplit[0], 10) * 60 + parseInt(startSplit[1], 10);
    const endMPM = parseInt(endSplit[0], 10) * 60 + parseInt(endSplit[1], 10);
    if (startMPM >= endMPM) {
      setResult(
        <Heading as="h1" size="md" mb={4} pl={4} pt={4} color="red.600">
          Start Time must be before End Time
        </Heading>,
      );
      return;
    }
    let availableSitters = [];
    for (const member of members) {
      let flag = true;
      for (const event of member.schedule) {
        if (!event.can_sit && event.day === dayOfWeek) {
          console.log(event);
          console.log(startMPM);
          console.log(endMPM);
          if (
            (event.start_time > startMPM && event.start_time < endMPM) ||
            (event.end_time > startMPM && event.end_time < endMPM) ||
            (event.start_time <= startMPM && event.end_time >= endMPM)
          ) {
            console.log(
              "1" + (event.start_time > startMPM && event.start_time < endMPM),
            );
            console.log(
              "2" + (event.end_time > startMPM && event.end_time < endMPM),
            );
            console.log(
              "3" + (event.start_time <= startMPM && event.end_time <= endMPM),
            );

            flag = false;
          }
        }
      }
      if (flag) {
        availableSitters.push(member);
      }
    }
    setResult(<AvailableUsers users={availableSitters} day={dayOfWeek} />);
  }

  return (
    <div className="container">
      <Heading as="h1" size="lg" mb={4} pl={4} pt={4} color="green.600">
        Group Members
      </Heading>
      <MembersTable memberData={members} removeMember={removeOneMember} />
      <Heading as="h1" size="lg" mb={4} pl={4} pt={4} color="green.600">
        Find a Sitter
      </Heading>
      <FindSitter onSubmit={handleTimeSubmit} />
      <Heading as="h1" size="lg" mb={4} pl={4} pt={4} color="green.600">
        Available Sitters
      </Heading>
      {result && <div style={{ marginTop: 20 }}>{result}</div>}
    </div>
  );
}

export default ManageGroup;
