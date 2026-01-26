import mongoose, { Schema } from "mongoose";

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  day: { type: String, required: true },
  start_time: { type: Number, required: true },
  end_time: { type: Number, required: true },
  location: { type: String, required: true },
  can_sit: { type: Boolean, default: true },
});

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    validate(value) {
      if (value.length < 2)
        throw new Error("Invalid email, must be at least 2 characters.");
    },
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  schedule: [
    {
      type: eventSchema,
      ref: "Event",
      required: true,
    },
  ],
  groups_in: [
    {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
  ],
  groups_created: [
    {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
  ],
});

const User = mongoose.model("User", UserSchema);

export default User;
