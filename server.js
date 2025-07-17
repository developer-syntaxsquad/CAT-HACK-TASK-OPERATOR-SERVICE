const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Client } = require("pg");

PORT = process.env.PORT

const client = new Client({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: process.env.DATABASE_PORT
});

client.connect()
    .then(() => console.log("Database Connected Successfully"))
    .catch((error) => console.log("DB Connection Error:", error.message));
    
const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (request, response) => {
    response.json({message: "server started successfully"}).status(200);
});


app.listen(PORT, (error) => {
    if(error){
        console.log(error.message);
    }else{
        console.log(`SERVER STARTED ON PORT ${PORT}`);
    };
});

