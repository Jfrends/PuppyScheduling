import userModel from "../schemas/user.js";

function getUsers() {
  let promise;
  promise = userModel.find();
  return promise;
}

function findUserById(id) {
  return userModel.findById(id);
}

function addUser(user) {
  const userToAdd = new userModel(user);
  const promise = userToAdd.save();
  return promise;
}

function findUserByName(name) {
  return userModel.find({ name: name });
}

function updateUserById(id, update) {
  let promise;
  promise = userModel.findByIdAndUpdate(id, update);
  return promise;
}

function getUserSchedules(requesterId, targetId) {
  console.log("getting user scheudles for", targetId, "by", requesterId);
  return new Promise((resolve, reject) => {
    userModel
      .findById(requesterId)
      .select("is_admin")
      .then((requester) => {
        if (!requester) {
          return reject(new Error("Requester user not found."));
        }

        if (!requester.is_admin && requesterId !== targetId) {
          return reject(
            new Error(
              "Requester does not have permission to view target schedules",
            ),
          );
        }

        return userModel.findById(targetId).select("schedule");
      })
      .then((target) => {
        if (!target) {
          return reject(new Error("Target user not found."));
        }
        resolve(target.schedule || []);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function addEventToUser(requesterId, targetId, eventData) {
  console.log(
    "Adding event to user",
    targetId,
    "by",
    requesterId,
    "with data: ",
    eventData,
  );

  return new Promise((resolve, reject) => {
    // Check permissions first
    userModel
      .findById(requesterId)
      .select("is_admin")
      .then((requester) => {
        if (!requester) {
          return reject(new Error("Requester user not found."));
        }

        const requesterIdStr = requesterId.toString();
        const targetIdStr = targetId.toString();

        if (!requester.is_admin && requesterIdStr !== targetIdStr) {
          return reject(new Error("Permission denied"));
        }

        // Add the event to the user's schedule
        return userModel.findByIdAndUpdate(
          targetId,
          { $push: { schedule: eventData } },
          { new: true, runValidators: true },
        );
      })
      .then((updatedUser) => {
        if (!updatedUser) {
          return reject(new Error("Target user not found."));
        }

        // Return the newly added event
        const newEvent = updatedUser.schedule[updatedUser.schedule.length - 1];
        resolve(newEvent);
      })
      .catch((err) => {
        console.error("Error adding event to user:", err);
        reject(err);
      });
  });
}

function deleteUserEvent(requesterId, targetId, eventId) {
  console.log(
    "Service: Deleting event",
    eventId,
    "for user",
    targetId,
    "by",
    requesterId,
  );
  console.log("EventId type:", typeof eventId);
  console.log("EventId value:", eventId);

  return new Promise((resolve, reject) => {
    userModel
      .findById(requesterId)
      .select("is_admin")
      .then((requester) => {
        if (!requester) {
          return reject(new Error("Requester user not found."));
        }

        const requesterIdStr = requesterId.toString();
        const targetIdStr = targetId.toString();

        if (!requester.is_admin && requesterIdStr !== targetIdStr) {
          return reject(new Error("Permission denied"));
        }

        return userModel.findByIdAndUpdate(
          targetId,
          { $pull: { schedule: { _id: eventId } } },
          { new: true },
        );
      })
      .then((updatedUser) => {
        if (!updatedUser) {
          return reject(new Error("User not found."));
        }

        console.log("Event deleted successfully from database");
        resolve(true);
      })
      .catch((err) => {
        console.error("Error deleting user event:", err);
        reject(err);
      });
  });
}

export default {
  addUser,
  getUsers,
  findUserById,
  findUserByName,
  updateUserById,
  getUserSchedules,
  addEventToUser,
  deleteUserEvent,
};
