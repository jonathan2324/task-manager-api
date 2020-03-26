const express = require('express')
const User = require('../models/user')
const router = new express.Router()
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const { sendCancelationEmail, sendWelcomeEmail } = require('../emails/account')

//we do not need auth function middleware for create or login
//because they are either creating the new password and profile
//or they are using credentials to get verified
//we only need it to perform/track user features once they are signed in.

//***********************************************
//ANYTIME we save user data, remove user data, use a method, use a static, we are awaiting getting data
//so we have to use await and the function must be asynchronous.
//***********************************************
//Create a new user and send to database
router.post('/users', async (req, res) => {
    //User -> Model constructor Provides the interface to MongoDB collections as well as creates document instances.
    //and save() saves the document instance
    /*
    req.body:
    Contains key-value pairs of data submitted in the request body. 
    By default, it is undefined, and is populated when you use body-parsing middleware such as express.json()
    which is why we use express.json() in the index.js file before the routers
    */

    //console.log(req) 
    const user = new User(req.body) //this creates a user object
    

    try {

        await user.save() 
        sendWelcomeEmail(user.email, user.name)
        //console.log(user) //creates an object that contains all the user infromation
        //here we are using a method because we are acting on a single document i.e a new user
        //this generates a token object and pushes it onto an array called tokens 
        const token = await user.generateAuthToken()

        //this sends the status code
        //this also JSON stringifies the data before sending
        //this is why we use toJSON so that it catches the object right after it is stringified,
        //it converts to an object by toObject and then we manipulate what is shown to the user.
        res.status(201).send({ user, token })
        

    } catch(e) {

        res.status(500).send(e)

    }
})

//Login user

router.post('/users/login', async(req, res) => {

    try {
        //here we are use the static on the model User.
        //we call statics on models and methods on schemas
        //when you use the model constructor, you create a new document

        //in this case, user(a new document) is an instance of User (the model)
        //here we are using a static because we are acting on the entire collection to match the user by credentials
        const user = await User.findByCredentials(req.body.email, req.body.password)
        

        //now we are using the method because we have found the specific user
        //and now we are using a method to target that one document. 
        const token = await user.generateAuthToken()

        res.send({ user, token })

    } catch(e) {

        res.status(400).send(e)

    }
}) 


//Logout user from one session.
router.post('/users/logout', auth, async (req, res) => {


    try {   
        /*
        here we have access to the req.user due to the auth function
        we can view the tokens by using req.user.tokens to show the tokens that the user has
        which shows how many times they logged in. 
        req.user.tokens is an array of the tokens so we can use filter to look at each individual token

        we have an array of token objects which each have an id and the token
        so we have to say token.token because we are looking at the token object
        and finding the token property on that object.

        token object -> { _id: (not the user id), token: 'somevalue' }

        we then compare this to the req.token which was declared in the auth function
        so we are saying that if the token.token is not matched with the req.token,
        we can return it so the other tokens are logged in and that one is excluded
        this is essentially like when you logout of netflix but multiple people using the account are still
        logged in. 

        */
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        //once we exclude that token, we need to save this data so we call save
        await req.user.save()

        //then we send it. 
        res.send()

    } catch (e) {

        res.status(500).send()
    }
})

//Logout of all user sessions

router.post('/users/logoutAll', auth, async (req, res) => {


    try {

        //we are taking the tokens array and setting it to an empty array to sign every session out. 
        req.user.tokens = []

        await req.user.save()

        res.send()


    } catch(e) {

        res.status(500).send()


    }
})

//Query and go into profile
//get post delete update always return req res callback
router.get('/users/me', auth, async (req, res) => {

    //console.log(req.user)
    res.send(req.user)

})


//Update user 

router.patch('/users/me', auth, async(req, res) => {

    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'age', 'password']
    const isValidUpdate = updates.every((update) => {
        return allowedUpdates.includes(update)
    })

    if(!isValidUpdate) {
        return res.status(400).send({ error: 'Invalid updates.'})
    }
    //we dont need the id anymore because we will have already been validated at this point.
    //const _id = req.params.id

    try {

        //const user = await User.findById(_id)
        //have to use brackets because dynamic
        //************* 
        updates.forEach((update) => {
            req.user[update] = req.body[update]

        })
        //using save middleware on model
        //we set up a pre save middleware which checks if the password was modified.
        //if it is, we use bcrypt to hash it!.
        await req.user.save()

        //const user = await User.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true })

        //we do not need this anymore because if we are logged in, there is a user that is found
        // if(!user) {
        //     return res.status(404).send()
        // }

        res.status(201).send(req.user)

    } catch (e) {

        res.status(500).send(e)
    }
})


//delete user
router.delete('/users/me', auth, async(req, res) => {

    //do not need because we are already authenticated
    //const _id = req.params.id

    try {

        //const user = await User.findByIdAndDelete(_id)

        // if(!user) {
        //     return res.status(404).send()
        // }
        await req.user.remove()

        sendCancelationEmail(req.user.email, req.user.name)
        res.status(200).send(req.user)

    } catch (e) {

        res.status(500).send(e)

    }
})

//Using multer to make an upload
//this returns a Multer instance
const upload = multer({
    limits: {
        fileSize: 1000000 //this states that our files have a 1 mb limit-> in megabytes
    },
    fileFilter (req, file, cb) {
        /*
        originalname-> Name of the file on the uploader's computer.
        match-> Matches a string an object that supports being matched against, 
        and returns an array containing the results of that search

        then we use a regular expression-> the \. means use the dot as a reference, then we
        list multiple file types but the or is a single |
        the dollar sign means check ends with
        so all together we are starting at the dot and if the file isnt one of those types after the dot, 
        we will reject it
        */
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            //cb means callback and we are saying that it should throw a new error
            return cb(new Error ('Please upload an image.'))
        }

        //if the file is uploaded and in the right format, call the callback using undefined as the first arg
        //and true to accept the file
        cb(undefined, true)
    }
})

//router to upload an avatar
//remember that we can only use req.file.buffer if we do not set up a dest on the multer instance
router.post('/users/me/avatar', auth, upload.single('avatar'), async(req, res) => {

    //implementig sharp
    //we are telling sharp to look on the req.file.buffer and resize the image
    //we then convert to png
    //we then write output to a buffer
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()

    req.user.avatar = buffer

    await req.user.save()

    res.send()
}, (error, req, res, next) => {

    //this is how we do error handling when using the multer api
    //this is a error-handling middleware function and since we are using multer,
    //this is how we can handle throwing the error within the multer instance if things go bad
    //if things go bad, the callback is generated throwing the new error
    //then we return that callback so we exit the whole thing and we would skip the initial req, res function
    //the error handling middleware must be last!
    //we would get to this function and it would see the error constructor was called and returned
    //we then fire off a failing status and an object which contains the error and the message.
    //when we throw a new Error we create the error object and since we are returning it and not using req, res, next
    //the function knows we are targeting the error object specifically
    res.status(400).send({ error: error.message})
})

//delete an avatar
router.delete('/users/me/avatar', auth, async(req, res) => {

    try {
        //setting the user avatar node to undefined
        req.user.avatar = undefined,

        await req.user.save()

        res.status(200).send()

    } catch (e) {

        res.status(500).send(e)

    }
})

//to fetch a user avatar
router.get('/users/:id/avatar', async (req, res) => {

    try {
        //find user by id using url params
        const user = await User.findById(req.params.id)

        //if the user doesnt exist or if they do not have an avatar
        //throw an error
        if(!user || !user.avatar) {
            throw new Error ()
        }

        //this is an example of setting a response header
        //here this will always work because when we upload an avatar image, we are always
        //converting it into a png
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)

    } catch (e) {

        res.status(500).send()

    }
})


module.exports = router