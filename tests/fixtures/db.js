const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const User = require('../../src/models/user')
const Task = require('../../src/models/task')

userOneId = new mongoose.Types.ObjectId //generates new user ID 


const userOne = {
    _id: userOneId,
    name: 'Mike',
    email: 'mike@example.com',
    password: '56what!!',
    tokens: [{
        //need the user _id in payload and we use the secret key to sign using jwt
        token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET)
    }]
}

userTwoId = new mongoose.Types.ObjectId

const userTwo = {
    _id: userTwoId,
    name: 'Eddy',
    email: 'eddy@example.com',
    password: '57what!!',
    tokens: [{
        //need the user _id in payload and we use the secret key to sign using jwt
        token: jwt.sign({ _id: userTwoId }, process.env.JWT_SECRET)
    }]
}

const taskOne = {
    _id: new mongoose.Types.ObjectId,
    name: 'Ronaldo',
    description: 'Update navbar',
    completed: false,
    owner: userOne._id
}

const taskTwo = {
    _id: new mongoose.Types.ObjectId,
    name: 'Kobe',
    description: 'Update button',
    completed: true,
    owner: userOne._id
}

const taskThree = {
    _id: new mongoose.Types.ObjectId,
    name: 'Messi',
    description: 'Update search',
    completed: false,
    owner: userTwo._id
}





const setupDatabase = async () => {
    //need to use jest lifecycle methods to clear database so test cases can consistently execute as expected
//wipe database and create dummy user
        await User.deleteMany()
        await Task.deleteMany()

        await new User(userOne).save()
        await new User(userTwo).save()
        await new Task(taskOne).save()
        await new Task(taskTwo).save()
        await new Task(taskThree).save()

}

module.exports = { userOne, userOneId, setupDatabase, userTwo, userTwoId, taskOne, taskTwo, taskThree }