const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const Joi = require("joi");
const dotenv = require("dotenv");
const app = express();
app.use(bodyParser.json());
app.use(cors());
dotenv.config();

let persons = [
  {
    id: "1",
    name: "Sam",
    age: 26,
    hobbies: [],
  },
]; // This is your in-memory database

app.set("db", persons);
const personSchema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number().integer().min(0).required(),
  hobbies: Joi.array().items(Joi.string()).default([]).required(),
});

// validation Middlelware
const validatePerson = (req, res, next) => {
  const { error } = personSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

// create a new person
app.post("/person", validatePerson, (req, res) => {
  const { name, age, hobbies } = req.body;
  const newPerson = {
    id: uuidv4(),
    name,
    age,
    hobbies: hobbies || [],
  };
  app.get("db").push(newPerson);
  res.status(200).json(newPerson);
});

// Get all persons
app.get("/person", (req, res) => {
  res.status(200).json(app.get("db"));
});

// Get a specific person by ID
app.get("/person/:personId", (req, res) => {
  const { personId } = req.params;
  const person = app.get("db").find((p) => p.id === personId);
  if (person) {
    res.status(200).json(person);
  } else {
    res.status(404).send("Person not found");
  }
});

// update an existing person
app.put("/person/:personId", validatePerson, (req, res) => {
  const { personId } = req.params;
  const { name, age, hobbies } = req.body;

  const person = app.get("db").find((p) => p.id === personId);

  if (!person) {
    return res.status(404).send("Person not found");
  } else {
    const updatedPerson = {
      id: personId,
      name,
      age,
      hobbies: hobbies || [],
    };
    const personIndex = app.get("db").indexOf(person);
    app.get("db")[personIndex] = updatedPerson;
    res.status(200).json(updatedPerson);
  }
});

// delete an existing person
app.delete("/person/:personId", (req, res) => {
  const { personId } = req.params;
  const personIndex = app.get("db").findIndex((p) => p.id === personId);
  if (personIndex === -1) {
    return res.status(404).send("Person not found");
  } else {
    app.get("db").splice(personIndex, 1);
    res.status(204).send();
  }
});

// Error handling middleware for non-existing endpoints
app.use((req, res) => {
  res.status(404).send("Page does not exist.");
});

// Error handling middleware for internal server errors
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal server error.");
});

/**if we have a port on the .env file it will use that otherwise port = 3000,
 * this is usefull incase the server uploaded on a host environment like Heroku**/
const port = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(port, () => {
    console.log("server runnig");
  });
}
module.exports = app;
