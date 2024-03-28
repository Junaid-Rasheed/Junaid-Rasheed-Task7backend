// app.js
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(
  "mongodb+srv://junaidrasheed300:IGLMSWvvCUz6DSjh@cluster0.tiqkdoq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// Define mongoose schema and model for User
const userSchema = new mongoose.Schema({
  name: String,
  age: Number,
  email: String,
  dob: Date,
});

const User = mongoose.model("User", userSchema);

// Define POST endpoint to add a new user -------------------------------------
app.post("/api/users", async (req, res) => {
  try {
    const { name, age, email, dob } = req.body;

    // Create a new user document
    const newUser = new User({
      name,
      age,
      email,
      dob,
    });

    await newUser.save();
    res.status(201).json({ message: "User added successfully", user: newUser });
  } catch (err) {
    console.error(err);
  }
});

// Define routes for API endpoints  -----------------------------------

app.get("/api/users", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortField = "name",
      sortOrder = "asc",
      ...filters
    } = req.query;
    const query = {};

    // Filtration
    for (const key in filters) {
      if (filters.hasOwnProperty(key)) {
        if (key === "name" || key === "email") {
          query[key] = { $regex: new RegExp(filters[key], "i") };
        } else if (key === "age") {
          if (filters[key].includes("-")) {
            const [minAge, maxAge] = filters[key].split("-").map(Number);
            query[key] = { $gte: minAge, $lte: maxAge };
          } else {
            query[key] = parseInt(filters[key]);
          }
        } else if (key === "dob") {
          if (filters[key].includes("-")) {
            const [startDate, endDate] = filters[key].split("-");
            query[key] = { $gte: new Date(startDate), $lte: new Date(endDate) };
          } else {
            query[key] = new Date(filters[key]);
          }
        }
      }
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortField] = sortOrder === "asc" ? 1 : -1;

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const results = {};
    if (endIndex < total) {
      results.next = {
        page: page + 1,
        limit,
      };
    }
    if (startIndex > 0) {
      results.previous = {
        page: page - 1,
        limit,
      };
    }

    results.totalPages = totalPages;

    results.data = await User.find(query)
      .sort(sortOptions)
      .limit(limit)
      .skip(startIndex)
      .exec();
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
