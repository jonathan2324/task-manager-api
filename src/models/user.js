const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Task = require('./task')


//a schema defines the shape of the documents within a collection
const userSchema = new mongoose.Schema({

    name: {
        //here we are saying that the name schema of the model
        //is of type string, it is required and we are trimming any spaces
        //left by the user input.
        //these are all custom logic validators that come with mongoose
        type: String,
        required: true,
        trim: true
    },
    age: {
        //here we are also setting a custom validator by
        //making a validate method and manually writing logic
        type: Number,
        default: 0,
        validate (value) {
            if(value < 0) {
                //if age is negative, throw an error use new Error constructor syntax
                throw new Error ('Age must be a positive number.')
            }
        }
    },
    email : {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate (value) {
            //here we use the validator third party library to check if the input
            //is a valid email and we say that if it is not (!) a valid email, throw an error. 
            if(!validator.isEmail(value)) {
                throw new Error('Email is invalid. Please enter a valid email.')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate (value) {
            if(value.toLowerCase().includes('password')) {
                throw new Error ('Your password cannot contain the word "password".')
            }
        }
    },
    tokens : [{
        token: {
            type: String,
            required: true
        }
    }],

    avatar: {
        type: Buffer //this is a type of data that deals with binary 
    }

}, {
    timestamps: true
}
)

//this is called whenever JSON.stringify is used which happens
//anytime we use res.send 
//remember that we are still sending back the user and the token generated in the login page
//the only thing we are changing is what is sent in relation to the user 
//so here we are excluding the password and tokens array so the data that
//is sent is just the user name, age, email and id
userSchema.methods.toJSON = function () {

    const user = this

    //this will take the JSON representation and turn it into a js object
    const userObject = user.toObject()
    //console.log(userObject)

    //now we can use object syntax to hide things
    //remember that we have already saved the data so it is sent to the database
    //this is only hiding the data we see from the response in postman which would
    //be how the client sees the data
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar


    //console.log(userObject)

    return userObject



}

// assign a function to the "methods" object of our userSchema
//console.log(userSchema)-> this will show that originally there are no methods or statics saved to schema
//methods is an object on the userSchema and generateAuthToken lives on the methods object
userSchema.methods.generateAuthToken = async function () {
    //Object of currently defined methods on this schema.
    const user = this// when we use generateAuthToken function, we have defined the document already as user

    //console.log(this) 
    //now the user id lives on this token as _id property
    //need to provide a payload which we choose to tbe the user _id and a secret key my string
    const token = jwt.sign({ _id: user._id.toString()}, process.env.JWT_SECRET)

    //concats onto tokens array. Remember that mongodb automatically generates an _id associated
    //with that indvidual token but we dont every really use that id
    //even when we logout, we are logging out using the token to search each token, not the _id associated
    //with the token object
    user.tokens = user.tokens.concat({ token: token })

    await user.save()

    return token

}

//This is not changing what we store on the user document, this is just for mongoose
//to see who owns the task and how they are related
//reference is Task model, the local field is the _id -> owner id aka user _id
//the owner is on the taskSchema
//This is the process for creating a populated virtual
//so now we can use await user.populate('tasks').execPopulate() and print the user tasks console.log(user.tasks)
//we can also do await tasks.populate('owner').execPopulate() to get the user profile if we console.log(task.owner)
//virtual is a relationship between two entities, we do not change what is stored on the documemnt
//first name the field, we chose 'tasks' and then the object that holds the reference
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id', //where the local data is stored-> owner object id is associated with the user
    foreignField: 'owner'//name of the field on the other thing aka the task that creates this relationship
})



//we use statics if we want to query the entire collection of documents
//you can see that we dont need to do user = this because
//we have not selected the user yet, we are lookng through all User models
userSchema.statics.findByCredentials = async (email, password) => {

    //this checks to see if the user email matches with one of the users 
    const user = await User.findOne({ email: email })

    if(!user) {
        throw new Error ('Unable to login')
    }

    //this uses the bcrypt to compare the hashed password decrypted vs the user password provided
    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch) {
        throw new Error('Unable to login')
    }

    return user

}

//this will run anytime we create a new user
//or when we update a user information
userSchema.pre('save', async function (next) {
    //this refers to the query object being updated
    /*
    The problem occurs because of how arrow functions treat "scope" differently to regular functions. Arrow functions 
    do not keep scope within the function but rather forcefully inherit scope from the outside or surrounding function
    (this means it will overwrite functions such as exampleMethod.bind(this)). In the case above; there is no outside
    function so the this value would be equal to undefined.

    However, when you use the regular function declaration, the scope can be overwritten by mongoose using 
    the .bind() method. As such, they bind the function to the schema object which allows you to have access to the 
    schema properties and functions within the function.


    */
    const user = this 
        //console.log(user)

        //this is how we create a hashed password
        //if the password is modified in any way ie create new user or update password
        //then we can hash the new password using bcrypt. -> run algorithm 8 times recommended
    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    //console.log(user.password)
    //call next to move on to next function
    next()
})

//delete all tasks when deleting user profile
userSchema.pre('remove', async function (next) {
    const user = this

    await Task.deleteMany({ owner: user._id })

    next()
})

//console.log(userSchema)-> this will show that the about are now saved to the schema

/*
First part is the models name
Defines a model or retrieves it. 
Models defined on the mongoose instance are available to all connection created by the same mongoose instance.

Second part is called a Schema which represents the things the model contains
and what the restrictions you want to set on that model.

*/
//creating the User model which is structured after the userSchema
const User = mongoose.model('User', userSchema)





//Export the User model so that we can use it in the index.js by importing.
module.exports = User