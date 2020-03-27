//Requirements
const express = require('express')

//require the entire mongoose library without setting it to a variable
//this connects the database and uses mongoose
require('./db/mongoose')

//Creates an Express application. The express() function is a top-level function exported by the express module.
const app = express()


//Import routers
const userRouter = require('../src/routers/user')
const taskRouter = require('../src/routers/task')

//Returns middleware that only parses 
//json and only looks at requests where the Content-Type header matches the type option.
app.use(express.json()) //this must come before the other use or it wont be able to parse json
app.use(userRouter)
app.use(taskRouter)
//setup the port used
//heroku uses process.env.Port so we say that it can use this port if it is available
//but if we are on local host, we will use port 3000


module.exports = app