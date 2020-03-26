//Requirements-> import mongoose

const mongoose = require('mongoose')

//connect mongoose to the mongodb database
//use local host aka 127.0.0.1 and connect to mongodb port which is default 27017
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false, 
})

