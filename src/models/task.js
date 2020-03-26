const mongoose = require('mongoose')
const validator = require('validator')

const taskSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    }, 
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
        validate (value) {
            if(value.length > 50) {
                throw new Error ('The maximum description length is 50 characters.')
            }
        }
    },
    notes: {
        type: String,
        trim: true,
        default: ''

    },
    priority: {
        type: String,
        default: 'Low'

    },
    completed: {
        type: Boolean,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId, //this is mongoose telling that the data stored here is an object id
        //which is true because it will be the user id 
        required: true,
        ref: 'User' //this gives us the ability to fetch user profile info aka a reference to a model
    }
}, {
    timestamps: true
})

const Task = mongoose.model('Task', taskSchema)

module.exports = Task