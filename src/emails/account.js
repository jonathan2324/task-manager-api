const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {

    sgMail.send({
        to: email,
        from: 'jonathanhuertas1423@utexas.edu',
        subject: 'Welcome to the Task Manager',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app!`
    })
}

const sendCancelationEmail = (email, name) => {

    sgMail.send({
        to: email,
        from: 'jonathanhuertas1423@utexas.edu',
        subject: 'Sorry you are leaving the Task Manager',
        text: `Sorry to see you go ${name}. We hope to see you back sometime soon.`
    })

}

module.exports = {
    sendWelcomeEmail: sendWelcomeEmail,
    sendCancelationEmail: sendCancelationEmail
}