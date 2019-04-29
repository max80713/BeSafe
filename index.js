'use strict';


const access_token = 'EAAIi3CJMbQkBACLJjN9eSr2j4qNZCDGzqZAxG3lRqqMAfQduaKrPA6zFNPQ2m43GRZC9fqxVlydBrf62IHZASmJi6TxyvT69o5KPOJrhZCfojRE4pYnrM05rBsr6X2tNouUZCVRwMh8o7vabuP17XfoMQfsASU1z1C34aEneWdnAZDZD';
// Imports dependencies and set up http server
const
  request = require('request'),
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()); // creates express http server

function broadcastMessage(textMessage) {
  let request_body = {
    "messages": [{
      "text": textMessage
    }]
  }

  request({
    "uri": "https://graph.facebook.com/v3.2/me/message_creatives",
    "qs": { access_token },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      const { message_creative_id } = body;
      console.log('broadcast message created');
      console.log('message_creative_id: ', message_creative_id);

      request_body = {
        message_creative_id,
        "messaging_type": "MESSAGE_TAG",
        "tag": "NON_PROMOTIONAL_SUBSCRIPTION"
      };

      request({
        "uri": "https://graph.facebook.com/v3.2/me/broadcast_messages",
        "qs": { access_token },
        "method": "POST",
        "json": request_body
      }, (err, res, body) => {
        if (!err) {
          const { broadcast_id } = body;
          console.log('broadcast message sent');
          console.log('broadcast_id: ', broadcast_id);
          
        } else {
          console.error("Unable to send message:" + err);
        }
      });
    } else {
      console.error("Unable to create message:" + err);
    }
  });
}

function sendMessage(message, recipientId) {
  let request_body = {
    "recipient": {
      "id": recipientId
    },
    message
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { access_token },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent')
      console.log('message:', message)
      console.log('recipientId:', recipientId);
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}

app.get('/', (req, res) => {
  res.status(200).send('Privacy Policy');
});

app.post('/notify', (req, res) => {
  const { type, payload } = req.body;

  if (type === 'disaster') {
    broadcastMessage(payload);
  } else if (type === 'message') {
    broadcastMessage(payload);
  }

  res.sendStatus(200);
});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "besafe-webhook"
    
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 
  const { body } = req;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      const webhook_event = entry.messaging[0];
      const sender_psid = webhook_event.sender.id;
      if (webhook_event.message) {
        console.log('message received')
        // Check if the message contains text
        if (webhook_event.message.text === 'Where are you?') { 
          const response = {
            text: 'Miami'
          }

          sendMessage(response, sender_psid)
          
        }  
      } else if (webhook_event.postback) {
        // handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));