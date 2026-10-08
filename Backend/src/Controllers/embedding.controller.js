const embeddingServices = require("../services/embedding.services");
const allMovies = require("../data/movies.json")
const moviesWithEmbeddings = require("../data/movieEmbeddings.json")

function cosineSimilarity(a, b) {

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {

        dotProduct += a[i] * b[i];

        magnitudeA += a[i] * a[i];

        magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    return dotProduct / (magnitudeA * magnitudeB);
}


async function createVector(req, res) {

    const { query } = req.body;

    if (!query) {
        return res.status(400).json({
            message: "Movie name is required"
        });
    }

    let result = moviesWithEmbeddings.find(
        item => item.title?.toLowerCase() === query.toLowerCase()
    );

    if (!result) {
        return res.status(404).json({
            message: "Movie not found"
        });
    }

    const text = `${result.title} ${result.description}`;

    const response = await embeddingServices(text);

    const queryVector = response[0].values;

    let similarMovies = [];

    for (const movie of moviesWithEmbeddings) {

        if (movie.title.toLowerCase() === query.toLowerCase()) {
            continue;
        }

        const movieVector = movie.embedding[0].values;

        const score = cosineSimilarity(
            queryVector,
            movieVector
        );

       // console.log(movie.title, score);

        similarMovies.push({
            title: movie.title,
            description: movie.description,
            match: score
        });
    }
    similarMovies.sort((a, b) => b.match - a.match);

    const topFive = similarMovies.slice(0,5)

    res.status(200).json({
        message: "Similar movies",
        topFive
    });
}


module.exports = {
    createVector
};