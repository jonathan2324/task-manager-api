
const User = require('../models/user')

const jwt = require('jsonwebtoken')

//create an async function
const auth = async (req, res, next) => {

    try {

        //console.log(req.headers.authorization.replace('Bearer ', ''))-> could also use this to get token
        //here we are saying that the token is in the header under the key Authorization
        //we are taking the token and taking off the Bearer and space to target the value specifically
        //remember if you look at req and then search for headers, you will see an authorization section
        //and the Bearer wording and the token will be there. So all we are doig is assigning the value
        //to a variable token
        const token = req.header('Authorization').replace('Bearer ', '')

        //remember that each token has the user id embedded under _id so
        //we can take the _id off of that token once it is verified
        //what is returned to the decoded variabel is an object which contains
        //the user id listed as _id and an iat which is a timestamp of when the token was issued at(iat)
        //we embedded the user id as part of the token when we did jwt.sign()
        //we added it to the payload in the generateAuthToken function
        //decoded has the _id property so we can atrget the user usijng decoded._id
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
       

       //user tokens.token because we are calling on a nested array which searches every token in the
       //tokens array.
       //here we are using findOne to match an id and token to authenticate user. 
       //remember that here we can use decoded._id because when
       //we created the token in generateAuthToken, we signed and added it to the payload

       //also, 'tokens.token' because we are lookng at the tokens array and trying to see if 
       //one of the token match with the token we have above
       //the strange syntax comes from the query an array of embedded documents for mongodb****
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

        if(!user) {
            throw new Error()
        }


        req.user = user //this sets req.user to the user picked out above and now
        //the async function in the routers function will use this user to send

        //this takes the token and sets it to the req.token so that we can verify the user in the router functions

        req.token = token

        //console.log(user)
        next()

    } catch (e) {

        res.status(401).send({ error: 'Please authenticate' })

    }
}


module.exports = auth