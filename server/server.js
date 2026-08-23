const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const userRoutes = require("./routes/users");

const app = express();
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

const medicationRoutes = require("./routes/medicationRoutes");

app.use(
  "/api/medications",
  medicationRoutes
);

const prescriptionRoutes = require("./routes/prescriptionRoutes");

app.use(
  "/api/prescriptions",
  prescriptionRoutes
);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const reportRoutes = require("./routes/reportRoutes");

const appointmentRoutes = require("./routes/appointments");
const doctorRoutes = require("./routes/doctors");
const patientRoutes = require("./routes/patients");
const reminderRoutes = require("./routes/reminders");
const assistantRoutes = require("./routes/assistant");
const chatbotRoutes = require("./routes/chatbot");
const drugRoutes = require("./routes/drugs");
const firebaseSessionRoutes = require("./routes/firebaseSession");

app.use(
  "/api/reports",
  reportRoutes
);

app.use(
  "/api/appointments",
  appointmentRoutes
);

app.use("/api/doctors", doctorRoutes);

app.use(
  "/api/patients",
  patientRoutes
);

app.use("/api/reminders", reminderRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/drugs", drugRoutes);
app.use("/api/auth/firebase-session", firebaseSessionRoutes);
app.use("/api/notifications", require("./routes/notifications"));
/*
=========================================================
MONGODB
=========================================================
*/

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });


/*
=========================================================
ROUTES
=========================================================
*/

app.use("/api/users", userRoutes);


/*
=========================================================
HEALTH CHECK
=========================================================
*/

app.get("/", (req, res) => {
  res.json({
    message: "MERIDIAN API running",
  });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});