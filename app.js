var request = require('request');
var restify = require('restify');
var builder = require('botbuilder');
var intents = new builder.IntentDialog();

var wikipediaEnd = 'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=';

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: '2a726598-82fb-4c91-8776-25e275fe0987',
    appPassword: 'RxrfX91ic4wUXffbXjj58yP'
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', intents);

intents.matches(/^change name/i, [
    function (session) {
        session.beginDialog('/profile');
    },
    function (session, results) {
        session.send('Ok... Changed your name to %s', session.userData.name);
    }
]);

intents.matches(/^tell me about/i, [
    function (session) {
        if (!session.userData.name) {
            session.beginDialog('/profile');
        } else {
            builder.Prompts.text(session, 'What is the topic you would like to know about?');
        }
    },
    function (session, results) {
        var topic = results.response;
        request(wikipediaEnd + topic, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var resultJson = JSON.parse(body);
                var mapped = Object.keys( resultJson.query.pages  ).map(function( uid ){
                    return (resultJson.query.pages[uid ].uid = uid ) && resultJson.query.pages[uid ];
                });
                var article = mapped[0].extract;                
                var answer = 'Ok... ' + session.userData.name + ', I found this on wikipedia : ' + article;
                session.send(answer);
            }
        });        
    }
]);

intents.onDefault([
    function (session, args, next) {
        if (!session.userData.name) {
            session.beginDialog('/profile');
        } else {
            next();
        }
    },
    function (session, results) {
        session.send('Hello %s!', session.userData.name);
    }
]);

bot.dialog('/profile', [
    function (session) {
        session.send('Hello my name is hellobot, I can help you to search info from the web. Please ask me "tell me about" to help you.');
        builder.Prompts.text(session, 'First, What is your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);
