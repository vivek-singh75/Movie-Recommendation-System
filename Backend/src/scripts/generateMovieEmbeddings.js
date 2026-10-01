require("dotenv").config();
const fs = require("fs");
const path = require("path");

const embeddingServices = require("../services/embedding.services");

async function generateMovieEmbeddings() {

    // Read all movies
    const moviesPath = path.join(__dirname, "../data/Movies.json");

    const moviesData = fs.readFileSync(moviesPath, "utf-8");

    const allMovies = JSON.parse(moviesData);

    const moviesWithEmbeddings = [];

    for (const movie of allMovies) {

        console.log(`Generating embedding for: ${movie.title}`);

        const text = `${movie.title}. ${movie.description}`;

        const embedding = await embeddingServices(text);

        moviesWithEmbeddings.push({
            title: movie.title,
            description: movie.description,
            embedding: embedding
        });
    }

    // Save embeddings
    const outputPath = path.join(
        __dirname,
        "../data/movieEmbeddings.json"
    );

    fs.writeFileSync(
        outputPath,
        JSON.stringify(moviesWithEmbeddings, null, 2)
    );

    console.log("All movie embeddings generated successfully!");
}

generateMovieEmbeddings();