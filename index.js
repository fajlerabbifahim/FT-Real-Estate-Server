const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware

app.use(cors());

app.use(express.json());

// mongoDB

app.get("/", async (req, res) => {
  res.send(console.log("ding dongg"));
});

app.listen(port, () => {
  console.log("app listen in this port", port);
});
