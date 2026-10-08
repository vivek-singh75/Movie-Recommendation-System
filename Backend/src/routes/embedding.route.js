const express = require("express")
const embeddingController = require("../Controllers/embedding.controller");
const movies = require("../data/movies.json");

const embeddingRouter = express.Router()

embeddingRouter.get("/movies", (req, res) => {
    res.status(200).json({ movies });
});

embeddingRouter.get("/vector" , embeddingController.createVector)
embeddingRouter.post("/vector", embeddingController.createVector)


module.exports = embeddingRouter