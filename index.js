'use strict';


const access_token = process.env.ACCESS_TOKEN;
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

function randomDate(start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end = new Date()) {
  return Math.floor(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

app.get('/', (req, res) => {
  res.status(200).send('Privacy Policy');
});

app.get('/requests', (req, res) => {
  res.status(200).json({
    data: [
      {
        id: 1,
        name: 'Alejandro Moreno',
        timestamp: randomDate(),
        location: {
          lat: '25.72627447',
          long: '-80.30569867'
        },
        type: 'food',
        message: 'I need food!',
      },
      {
        id: 2,
        name: 'Maria Fergieson',
        timestamp: randomDate(),
        location: {
          lat: '25.77633542',
          long: '-80.30405303'
        },
        type: 'injury',
        message: 'HELP',
      },
      {
        id: 3,
        name: 'Garrett Malone',
        timestamp: randomDate(),
        location: {
          lat: '25.80835172',
          long: '-80.28071819'
        },
        type: 'injury',
        message: 'Somebody hurt! We need help!',
      },
      {
        id: 4,
        name: 'Hassan Hopkins',
        timestamp: randomDate(),
        location: {
          lat: '25.73730658',
          long: '-80.25956455'
        },
        type: 'injury',
        message: `I'm goint to die...`,
      },
      {
        id: 5,
        name: 'Clodagh Dunn',
        timestamp: randomDate(),
        location: {
          lat: '25.71686706',
          long: '-80.26698473'
        },
        type: 'water',
        message: 'Send me water, please!',
      }
    ]
  });
})

app.post('/notify', (req, res) => {
  const { type, payload } = req.body;

  const recipientId = '2920433724641026';
  if (type === 'disaster') {
    sendMessage({
      text: payload
    }, recipientId);
    sendMessage({
      text: "Where are you?",
      quick_replies: [
        {
          "content_type":"location"
        }
      ]
    }, recipientId);
  } else if (type === 'message') {
    sendMessage(response, '2920433724641026');
  }

  res.sendStatus(200);
});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  let { VERIFY_TOKEN } = provess.env;
    
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
          
        } else if (webhook_event.message.attachments) {
          console.log(webhook_event.message.attachments[0]);
          /* 
          "title": "Facebook HQ",
          "url": "https://www.facebook.com/l.php?u=https%....5-7Ocxrmg",
          "type": "location",
          "payload": {
            "coordinates": {
              "lat": 37.483872693672,
              "long": -122.14900441942
            }
          }
          */
          sendMessage({
            text: 'You are near the hurricane!'
          }, sender_psid);
          sendMessage({
            text: `Take the advice of local authorities. Evacuate if ordered.
            If an evacuation is necessary, unplug all appliances, TV's and computers before leaving your home.
            If possible, move important items to a higher floor or surface such as a counter or shelf to protect expensive equipment from flooding. Remove fuses from the air conditioning system to prevent damage.
            Turn off water to prevent flooding from broken pipes.
            Turn off gas to prevent leaks from occurring.
            Ensure your car is in good running condition and has a full tank of gas, extra emergency supplies and a change of clothes.
            Determine escape routes from your home and a nearby place to meet with loved ones. These should be measured in tens of miles when possible`
          }, sender_psid)
          sendMessage({
            attachment: {
              "type": "template",
              "payload": {
                "template_type": "list",
                "top_element_style": "compact",
                "elements": [
                  {
                    "title": "Quang Ngoc",
                    "subtitle": "Safe @San Jose McEnery Convention Center",
                    "image_url": "https://scontent-sjc3-1.xx.fbcdn.net/v/t1.0-1/p320x320/52585213_1951969804915515_4222149892182638592_n.jpg?_nc_cat=111&_nc_ht=scontent-sjc3-1.xx&oh=d390db93f5df74da573a1b9e981a71ef&oe=5D34BD14",          
                    "default_action": {
                      "type": "web_url",
                      "url": "https://www.facebook.com/qn.khuat",
                      "messenger_extensions": true,
                      "webview_height_ratio": "tall"
                    }
                  },
                  {
                    "title": "Phong Vũ",
                    "subtitle": "In danger @Miami Beach",
                    "image_url": "https://scontent-sjc3-1.xx.fbcdn.net/v/t1.0-1/p320x320/50442205_10156196260348519_917678904490065920_n.jpg?_nc_cat=104&_nc_ht=scontent-sjc3-1.xx&oh=2c6584304db5ff939b4965b0b5238b30&oe=5D2CB267",          
                    "default_action": {
                      "type": "web_url",
                      "url": "https://www.facebook.com/iphongx",
                      "messenger_extensions": true,
                      "webview_height_ratio": "tall"
                    }
                  },
                ],
                  "buttons": [
                  {
                    "title": "Show More Friends",
                    "type": "postback",
                    "payload": "show_more_friends"            
                  }
                ]  
              }
            }
          }, sender_psid)
        } else {
          sendMessage({
            text: 'How can I help you?'
          }, sender_psid);
        }
      } else if (webhook_event.postback) {
        sendMessage({
          text: 'How can I help you?'
        }, sender_psid);
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