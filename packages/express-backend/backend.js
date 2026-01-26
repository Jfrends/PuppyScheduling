import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import userModel from "./schemas/user.js";
import userServices from "./api/user-services.js";
import groupServices from "./api/group-services.js";
import eventServices from "./api/event-services.js";
import dotenv from "dotenv";
import authFunctions from "./auth.js";

const app = express();
const port = 8000;
app.use(cors());
app.use(express.json());

dotenv.config(); // Load environment variables

mongoose.set("debug", true);
console.log("mongo uri: ", process.env.MONGODB_URI);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

function addUser(user) {
  const userToAdd = new userModel(user);
  const promise = userToAdd.save();
  return promise;
}

app.get("/users", authFunctions.authenticateUser, (req, res) => {
  let promise;
  promise = userModel.find();

  // send results
  promise
    .then((found_users) => {
      if (found_users.length > 0) {
        res.send({ users: found_users });
      } else {
        res.status(404).send("No users found.");
      }
    })
    .catch((error) => {
      console.error("Error fetching users:", error);
      res.status(500).send("Internal server error.");
    });

  return;
});

app.get("/users/:id", authFunctions.authenticateUser, (req, res) => {
  const id = req.params["id"];
  let result = userServices.findUserById(id);

  result
    .then((user) => {
      if (user) {
        res.send(user);
      } else {
        res.status(404).send("Resource not found.");
      }
    })
    .catch((error) => {
      console.log("error getting user: ", error);
      res.status(500).send("Internal server error.");
    });
});

app.get("/users/:id/events", authFunctions.authenticateUser, (req, res) => {
  userServices
    .getUserSchedules(req.user.sub, req.params.id)
    .then((events) => {
      // log events
      console.log("Events for user:", req.params.id, events || []);
      res.json(events || []);
    })
    .catch((error) => {
      res.status(500).send("Internal server error");
      console.error("Error getting user events:", error);
    });
});

app.post("/users", (req, res) => {
  console.log("Received request to add user:", req.body);
  const userToAdd = req.body;

  // ensure all fields are filled
  if (
    userToAdd["name"] === undefined ||
    userToAdd["email"] === undefined ||
    userToAdd["password"] === undefined
  ) {
    res.status(400).send("Invalid request body.");
    return;
  }
  console.log("Adding user:", userToAdd);
  addUser(userToAdd)
    .then((savedUser) => {
      res.status(201).json({
        message: "User created successfully",
        user: {
          savedUser,
        },
      });
    })
    .catch((error) => {
      res.status(500).send("Internal server error.");
      console.error("Error adding user:", error);
    });
});

app.patch("/users/:id", authFunctions.authenticateUser, (req, res) => {
  const { id } = req.params;
  const update = req.body;

  userServices
    .updateUserById(id, update)
    .then((result) => {
      if (result) {
        console.log("patching user");
        res.status(200).send();
      } else {
        res.status(404).send("Resource not found.");
      }
    })
    .catch((error) => {
      res.status(500).send("Internal server error.");
      console.error("Error patching user:", error);
    });
});

app.delete("/users/:id", (req, res) => {
  const id = req.params["id"];

  userModel
    .findByIdAndDelete(id)
    .then((result) => {
      if (result) {
        res.status(204).send();
      } else {
        res.status(404).send("Resource not found.");
      }
    })
    .catch((error) => {
      console.log("Error deleting user", error);
      res.status(500).send("Internal server error.");
    });
});

// GROUP routes
app.post("/groups", (req, res) => {
  console.log("Received request to add group:", req.body);
  const groupToAdd = req.body;

  // ensure all fields are filled
  if (
    groupToAdd["name"] === undefined ||
    groupToAdd["description"] === undefined ||
    groupToAdd["admins"] === undefined ||
    groupToAdd["members"] === undefined
  ) {
    res.status(400).send("Invalid request body.");
    return;
  }
  console.log("Adding group:", groupToAdd);
  groupServices
    .addGroup(groupToAdd)
    .then((createdGroup) => {
      res.status(201).send(createdGroup);
    })
    .catch((error) => {
      res.status(500).send("Internal server error.");
      console.error("Error adding group:", error);
    });
});

app.patch("/groups/:id", (req, res) => {
  const { id } = req.params;
  const update = req.body;

  groupServices
    .updateGroupById(id, update)
    .then((result) => {
      if (result) {
        console.log("patching group");
        res.status(200).send();
      } else {
        res.status(404).send("Resource not found.");
      }
    })
    .catch((error) => {
      res.status(500).send("Internal server error.");
      console.error("Error patching group:", error);
    });
});

app.get("/groups", (req, res) => {
  const name = req.query.name;

  groupServices
    .getGroups(name)
    .then((groups) => {
      if (groups.length > 0) {
        res.send({ groups_list: groups });
      } else {
        res.status(404).send("No groups found.");
      }
    })
    .catch((error) => {
      console.error("Error fetching groups: ", error);
      res.status(500).send("Internal server error");
    });
});

app.get("/groups/:id", (req, res) => {
  const { id } = req.params;

  groupServices
    .findGroupById(id)
    .then((group) => {
      res.send(group);
    })
    .catch((error) => {
      console.error("Error fetching group: ", error);
      res.status(500).send();
    });
});

app.get("/:userId/groups", (req, res) => {
  const { userId } = req.params;

  userServices
    .findUserById(userId)
    .then((user) => {
      if (!user) {
        return res.status(404).send("User not found.");
      }
      const groupIds = user.groups_in.map((group) => group.toString());
      return Promise.all(groupIds.map((id) => groupServices.findGroupById(id)));
    })
    .then((groups) => {
      res.json({ groups_list: groups });
    })
    .catch((error) => {
      console.error("Error fetching user's groups:", error);
      res.status(500).send("Internal server error.");
    });
});

app.delete("/groups/:id", (req, res) => {
  const { id } = req.params;

  groupServices
    .findGroupByIdAndDelete(id)
    .then((result) => {
      if (result) {
        console.log("Deleting group");
        res.status(204).send();
      } else {
        res.status(404).send("Resource not found");
      }
    })
    .catch((error) => {
      console.log("Error deleting user: ", error);
      res.status(500).send("Internal server error.");
    });
});

//EVENT routes
app.post("/events", (req, res) => {
  console.log("Received request to add event:", req.body);
  const eventToAdd = req.body;

  // ensure all fields are filled
  if (
    eventToAdd["title"] === undefined ||
    eventToAdd["day"] === undefined ||
    eventToAdd["startTime"] === undefined ||
    eventToAdd["endTime"] === undefined ||
    eventToAdd["location"] === undefined ||
    eventToAdd["canSit"] === undefined
  ) {
    res.status(400).send("Invalid request body.");
    return;
  }
  console.log("Adding event:", eventToAdd);
  eventServices
    .addEvent(eventToAdd)
    .then(() => {
      res.status(201).send();
    })
    .catch((error) => {
      res.status(500).send("Internal server error.");
      console.error("Error adding event:", error);
    });
});

// Create a new event for a user
app.post("/users/:id/events", authFunctions.authenticateUser, (req, res) => {
  const userId = req.params.id;
  const eventData = req.body;

  console.log("Creating event for user:", userId, eventData);

  userServices
    .addEventToUser(req.user.sub, userId, eventData)
    .then((result) => {
      console.log("Event created successfully:", result);
      res.status(201).json(result);
    })
    .catch((error) => {
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Internal server error" });
    });
});

app.get("/events", (req, res) => {
  const title = req.query.title;

  eventServices
    .getEvents(title)
    .then((events) => {
      if (events.length > 0) {
        res.send({ events_list: events });
      } else {
        res.status(404).send("No events found.");
      }
    })
    .catch((error) => {
      console.error("Error fetching events: ", error);
      res.status(500).send("Internal server error");
    });
});

app.patch("/events/:id", (req, res) => {
  const update = req.body;
  const { id } = req.params;

  eventServices
    .updateEventById(id, update)
    .then((result) => {
      if (result) {
        console.log("patching event");
        res.status(200).send();
      } else {
        res.status(404).send("Resource not found.");
      }
    })
    .catch((error) => {
      res.status(500).send("Internal server error.");
      console.error("Error patching event:", error);
    });
});

app.get("/events/:id", (req, res) => {
  const { id } = req.params;

  eventServices
    .findEventById(id)
    .then((event) => {
      res.send(event);
    })
    .catch((error) => {
      console.error("Error fetching event: ", error);
      res.status(500).send();
    });
});

app.delete("/events/:id", (req, res) => {
  const { id } = req.params;

  eventServices
    .findEventByIdAndDelete(id)
    .then((result) => {
      if (result) {
        console.log("Deleting event");
        res.status(204).send();
      } else {
        res.status(404).send("Resource not found.");
      }
    })
    .catch((error) => {
      console.log("Error deleting event:", error);
      res.status(500).send("Internal server error.");
    });
});

// Delete an event
app.delete(
  "/users/:id/events/:eventId",
  authFunctions.authenticateUser,
  (req, res) => {
    const { id: userId, eventId } = req.params;

    console.log("Deleting event:", eventId, "for user:", userId);

    userServices
      .deleteUserEvent(req.user.sub, userId, eventId)
      .then((result) => {
        if (result) {
          console.log("Event deleted successfully");
          res.status(204).send();
        } else {
          res.status(404).json({ error: "Event not found" });
        }
      })
      .catch((error) => {
        console.error("Error deleting event:", error);
        res.status(500).json({ error: "Internal server error" });
      });
  },
);

// login route from auth TA 4
app.post("/login", authFunctions.loginUser);
app.post("/signup", authFunctions.registerUser);

app.listen(process.env.PORT || port, () => {
  console.log("REST API is listening.");
});
