const express = require("express");

const app = express()

const embeddingRouter = require("./routes/embedding.route")


app.use(express.json())

app.use("/api/ai" , embeddingRouter)
 

module.exports = app