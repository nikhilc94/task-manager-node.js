const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const validator = require('validator');

const Task = require('../models/task');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error('Age must be a positive number');
        }
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minLength: 7,
      validate(value) {
        if (value.toLowerCase().includes('password')) {
          throw new Error('Password cannot contain the word "password"');
        }
      },
    },
    avatar: {
      type: Buffer,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// This is to setup a relationship b/w users & tasks collections.
// This does not get saved to the DB.
userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner',
});

// Token middleware
// Binding this function to the instance using methods
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_KEY);
  user.tokens = [...user.tokens, { token }];
  await user.save();
  return token;
};

// Public Profile middleware - Send back the user data excluding passwords, tokens etc
// toJSON runs automatically when res.send() is called so no need to call this explicitely
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;
  return userObject;
};

// Login middleware
// Binding this function to the model using statics
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Unable to login');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Unable to login');
  }
  return user;
};

// Password hashing
// Run this middleware pre (before) 'save' event.
userSchema.pre('save', async function (next) {
  const user = this;
  // Checking if password field is modified in any route
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

// Delete tasks when a user is removed
userSchema.pre('remove', async function (next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
