const express = require('express');
const app = express();
require('dotenv').config();
const path = require('path');
_ = require("underscore");

const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json({
    limit: "50mb"
}));

const crudRouter = require('./routes/crud.routes');

app.use('/api', crudRouter);

const port = process.env.PORT;

// Database Connection

require(path.join(__dirname, '/config', 'database'))();

app.listen(port, () => {
    console.log(`Server is connected @ http://127.0.0.1:${port}`);
})