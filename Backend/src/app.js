const express = require("express");
const cors = require("cors");

const app = express()

const embeddingRouter = require("./routes/embedding.route")

app.use(cors())
app.use(express.json())

app.use("/api/ai" , embeddingRouter)
  
 
module.exports = app