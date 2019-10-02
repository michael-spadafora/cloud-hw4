var express = require('express');
var router = express.Router();
var amqp = require('amqplib/callback_api');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/speak', async function (req, res) {
  let key = req.body.key
  let message = req.body.msg
  amqp.connect('amqp://localhost', function(error0, connection) {
    if (error0) {
      throw error0;
    }
    connection.createChannel(function(error1, channel) {
      if (error1) {
        throw error1;
      }
      var exchange = 'hw4';
      var msg = message;

      channel.assertExchange(exchange, 'direct', {
        durable: false
      });

      channel.publish(exchange, key, Buffer.from(msg));

      console.log(" [x] Sent %s", msg);
      res.send("sent " + msg)
    });

    setTimeout(function() { 
      connection.close(); 
      process.exit(0); 
    }, 500);
  });
})

router.post('/listen', async function (req, res) {
  let keys = req.body.keys

  amqp.connect('amqp://localhost', function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }
        var exchange = 'hw4';

        channel.deleteExchange(exchange)
        
        channel.assertExchange(exchange, 'direct', {
            durable: false
        });

        channel.assertQueue('', {
            exclusive: true
        }, function(error2, q) {
            if (error2) {
                throw error2;
            }
            console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);

            for (let i = 0; i < keys.length; i++){
              channel.bindQueue(q.queue, exchange, keys[i]);
            }

            channel.consume(q.queue, function(msg) {
                if (msg.content) {
                    console.log(" [x] %s", msg.content.toString());
                    res.send("recieved " + msg.content.toString())
                }
            }, {
                noAck: true
            });
        });
      });
    });
})

module.exports = router;
