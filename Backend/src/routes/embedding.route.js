const express = require("express")
const embeddingController = require("../Controllers/embedding.controller");

const embeddingRouter = express.Router()

embeddingRouter.get("/vector" , embeddingController.createVector)


module.exports = embeddingRouter