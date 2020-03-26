const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')

//-> Use the express.Router class to create modular, mountable route handlers. 
//A Router instance is a complete middleware and routing system; for this reason, it is often referred to as a “mini-app”.
const router = new express.Router()

//Add a new task
router.post('/tasks', auth, async (req, res) => {
    //spread out all properties on req.body
    //then after we upload the owner as the req.user._id which comes from auth
    const task = new Task({
        ...req.body, //copies all properties onto new object
        owner: req.user._id //owner is not specified during request it is only on token
    })
    

    //change from promise chaining to async/await
    try {

        await task.save()

        res.status(201).send(task)

    } catch(e) {

        res.status(500).send(e)

    }


})

//Query all tasks
// GET /tasks?completed=true, /tasks?completed=false -> this is what match is for
// GET /tasks?limit=10&skip=20 -> limit and skip variables
// GET /tasks?sortBy=createdAt:asc or /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {

    //req.query contains the URL query parameters after the '?' in URL, req.params contains route parameters
    //so here we arent assigning route parameters, a good example of that is when we use the id in the 
    //route to get a specific task by its id, we do /tasks/:id to the url and id would be in the req.params

    //here we are using key values after the ? in the url so we arent changing the route

    //we will use match as the object provided to populate
    const match = {}
    const sort = {}
    //we have to set up ternary operator because if someone types true, we dont get back the boolean in 
    //req.query, we get back the string true or false so we have to compare that to see if the req.query.completed 
    //matches the string true to create the actual boolean 
    //if the strings match, that is true, if they dont match that is false stored on match.completed
    //this creates three ways the user can view options so far, all, the ones completed and the tasks not completed
    if (req.query.completed) {
        match.completed = req.query.completed === 'true' 
    }

    if (req.query.sortBy) {
        //here we are saying that we are splitting the string in the url assigned after sortBy based on the ':' char
        //for example, if /tasks?sortBy=createdAt:desc, now we have const parts = ['createdAt', 'desc']
        //so now we can say that if const sort = { createdAt: 'desc' } or sort[createdAt] = 'desc', then 
        //the ternary operator would be true and go the -1 route
        //if it is false, then it will go the 1 route
        //so if you choose desc, it will show the completed tasks at the top and incomplete below
        //if you choose createdAt:asc, it will show the incomplete at top and the completed at the bottom.
        //it is a top to bottom direction
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {

        //remember that async returns a promise so we have 
        //to set it to a variable and then await works with the promise because only a promise async await or .then can unwrap the data in a promise.
        //remember that async returns a prommise and await gives you access to the promise once it is fullfilled
        //const tasks = await Task.find({})
        //this will populate the tasks and associate with the user
        //then we send this with req.user.tasks
        //customize populate
        //match is an object where we can specify which tasks we are trying to match
        //options property for pagination and sorting
        await req.user.populate({ 
            path: 'tasks',
            match: match,
            options: {
                limit: parseInt(req.query.limit),  //this looks at the url and sees what the limit equals.
                skip: parseInt(req.query.skip),      //this lools at the url and sees what the skip equals
                sort: sort
            }

        }).execPopulate()

        //sending the virtual
        res.send(req.user.tasks)

    } catch (e) {

        res.status(400).send(e)

    }

})

//Query one task
router.get('/tasks/:id', auth, async (req, res) => {
    
    //req.params -> /tasks/:somevalue-> the somevalue part is the name of the params object property
    //so the params is an object inside of the req object so if we console.log req.params here
    //we would see { id: someidnumberstring(part of URL) }
    const _id = req.params.id

    try {

        //const task = await Task.findById(_id)
        const task = await Task.findOne({
            _id: _id, owner: req.user._id
        })

        if(!task) {
            return res.status(404).send()
        }

        res.status(201).send(task)

    } catch (e) {

        res.status(500).send(e)

    }
})

//Update a task
router.patch('/tasks/:id', auth, async(req, res) => {

    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'description', 'notes', 'priority', 'completed']

    const isValidUpdate = updates.every((update) => {
        return allowedUpdates.includes(update)
    })

    if(!isValidUpdate) {
        return res.status(400).send({ error: 'Inavlid updates.'})
    }

    const _id = req.params.id

    try {

        //const task = await Task.findById(_id)

        //use findOne to locate a specific task which has the id matching and owner id matching
        const task = await Task.findOne({ _id: _id, owner: req.user._id })

        

        //const task = await Task.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true })

        if(!task) {
            return res.status(404).send()
        }

        updates.forEach((update) => task[update] = req.body[update])

        await task.save()

        res.status(201).send(task)

    } catch (e) {

        res.status(500).send(e)

    }

})


//Delete a task

router.delete('/tasks/:id', auth, async(req, res) => {

    const _id = req.params.id

    try {

        const task = await Task.findOneAndDelete({ _id: _id, owner: req.user._id })

        if(!task) {
            return res.status(404).send()
        }

        res.status(201).send(task)

    } catch (e) {

        res.status(500).send(e)

    }
})


module.exports = router