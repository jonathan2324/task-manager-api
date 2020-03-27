const app = require('./app')

//setup the port used
//heroku uses process.env.Port so we say that it can use this port if it is available
//but if we are on local host, we will use port 3000
const port = process.env.PORT


app.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})