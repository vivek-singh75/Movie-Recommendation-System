const embeddingServices = require("../services/embedding.services");
const allMovies = require("../data/movies.json")

async function createVector(req , res) {
    const {query}  = req.body;

    if(!query){
        return res.status(408).json({message : "inputs are not defined"});
    }

   // console.log(allMovies);

    let result = allMovies.find(
        item => item.title?.toLowerCase() === query.toLowerCase()
    )
    result = `${result.title} ${result.description}`

    //console.log(result)

    const response =await embeddingServices(result)

   // console.log(response)

    res.status(203).json({
        message :" vectors are",
        response
    })

}

module.exports = {
    createVector,

}