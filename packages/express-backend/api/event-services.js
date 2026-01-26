import eventModel from "../schemas/event.js";

function addEvent(event) {
  const eventToAdd = new eventModel(event);
  const promise = eventToAdd.save();
  return promise;
}

function getEvents(title) {
  let promise;
  if (title == undefined) {
    promise = eventModel.find();
  } else {
    promise = eventModel.find({ title: title });
  }

  return promise;
}
function findEventById(id) {
  return eventModel.findById(id);
}

function updateEventById(id, update) {
  let promise;
  promise = eventModel.findByIdAndUpdate(id, update);
  return promise;
}

function findEventByIdAndDelete(id) {
  return eventModel.findByIdAndDelete(id);
}

export default {
  addEvent,
  getEvents,
  updateEventById,
  findEventById,
  findEventByIdAndDelete,
};
