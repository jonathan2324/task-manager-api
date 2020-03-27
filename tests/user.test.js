const request = require('supertest') //important for testing 
const app = require('../src/app')
const User = require('../src/models/user')
const { userOne, userOneId, setupDatabase } = require('./fixtures/db')

beforeEach(setupDatabase)

//create new user test
test('Should sign up a new user', async () => {
    const response = await request(app).post('/users').send({
        name: 'Jonathan',
        email: 'jonathan@example.com',
        password: 'MyPass777'
    }).expect(201)

    //assert that database was changed correctly-> new user with same id 
    //we have user and token that come back but we want user
    const user  = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()//expecting user not to be null

    //assert about response body


    expect(response.body).toMatchObject({
        user: {
            name: 'Jonathan',
            email: 'jonathan@example.com',
            
        },
        token: user.tokens[0].token
    })

    expect(user.password).not.toBe('MyPass777')
})

//login test
//we can run a test to see if we can fecth the second token because when we created the user, we create them with one
//token already so if we log in, it will verify that we logged in successfully.
test('Should login existing user', async() => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    //we can use the response to get the user id 
    // then we can compare the token values to make sure we logged in
    const user  = await User.findById(response.body.user._id)

    expect(response.body.token).toEqual(user.tokens[1].token)

})

//login test failure
//r400 status code-indicates that the server cannot 
//or will not process the request due to something that is perceived to be a client error
test('Should return error for wrong login credentials', async () => {
    await request(app)
    .post('/users/login')
    .send({
        email: 'jonathan@example.com',
        password: 'jonathan123'

    }).expect(400)
})

//testing fetching user profile
test('Should get profile for user', async () => {



    //we need to use auth header
    await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`) //setting header for authorization******
    .send()
    .expect(200)
})

//Failing profile fetching
test('should not get profile for unauth user', async() => {
    await request(app)
    .get('/users/me')
    .send()
    .expect(401)
})

//delete acount when authd
test('should delete user profile if authorized', async() => {

    await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)//needed to mimick logged in user
    .send()
    .expect(200)

    //look up user by id and expect to be null
    const user = await User.findById(userOneId)
    expect(user).toBeNull()

})

//should not delete account because not authd

test('Should not delete user profile if not authorized', async() => {
    await request(app)
    .delete('/users/me')
    .send()
    .expect(401)//unauthorized client 
})

test('Should upload avatar image', async() => {

    await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg') //attach is provided by supertest, first is the form field
    .expect(200)                                        //we are trying to set and the next is the location of image 
                                                        //from the root of our project

    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))
    //toBe uses === eqality operator
    //objects are not equal to other objkects even if they have the same properties
    //they are checking if they are the same in memory which wont be true even if they have the same properties
    //toEqual would make two empty objects equal and pass a test
})

test('Should update valid user fields', async () => {

    const updates = {
        name: 'MikeG'
    }

    await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send(updates)
    .expect(201)

    const user = await User.findById(userOneId)
    expect(user.name).toEqual(updates.name)
    
})

test('Should not update invalid user fields', async () => {
    updates = {
        location: 'Austin'
    }

    await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send(updates)
    .expect(400)

    
})



