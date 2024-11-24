import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import identifyController from "./controllers/identity.js";


dotenv.config();

const app = express();
const port = process.env.PORT || 3000;


app.use(express.json());


app.get('/', (req, res) => {
    res.send("Hello World!");
})


app.post('/identify', identifyController )


connectDB().then(() => {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}).catch((error) => {
    console.error('Failed to connect to the database:', error.message);
});
