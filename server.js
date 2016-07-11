// BASE Setup
var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    morgan = require('morgan'),
    mongoose = require('mongoose'),
    port = process.env.PORT || 8080,
    path = require('path'),
    User = require('./app/models/user'),
    Container = require('./app/models/container'),
    jwt = require('jsonwebtoken'),
    superSecret = 'c0ntainersek';

mongoose.connect('mongodb://localhost:27017/container-tracker');

// APP CONFIG - user body parser to grab info from POST requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Enable CORS requests
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');
  next();
});

// log all requests
app.use(morgan('dev'));

// ROUTES in our API
app.get('/', function(req, res) {
  res.send('Welcome to our home page');
});

var apiRouter = express.Router();

//route for authenticating our users
apiRouter.post('/authenticate', function(req, res) {
  User.findOne({
    username: req.body.username
  }).select('name username password').exec(function(err, user) {
    if (err) throw err;

    //no user with that username was found
    if (!user) {
      res.json({
        success: false,
        message: 'Authentication failed. User not found.'
      });
    } else if (user) {
      //check if pswd matches
      var validPassword = user.comparePassword(req.body.password);
      if (!validPassword) {
        res.json({
          success: false,
          message: 'Authentication failed. Wrong Password'
        });
      } else {
        //user is found, create token
        var token = jwt.sign({
          name: user.name,
          username: user.username
        }, superSecret, {
          expiresIn : 60*60*24
        });

        //return info including token
        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      }
    }
  });
});

//route middleware and first route
apiRouter.use(function(req, res, next) {
  console.log('somebody just came to out app');

  next();
});

apiRouter.get('/', function(req, res) {
  res.json({ message: 'welcome to container api!' });
});

// on routes that end in /users
apiRouter.route('/users')
  .post(function(req, res) {
    //create new instance of user model
    var user = new User();

    user.name = req.body.name;
    user.username = req.body.username;
    user.password = req.body.password;

    //save user info
    user.save(function(err) {
      if (err) {
        if (err.code == 11000)
          return res.json({ success: false, message: 'A user with that\
          username already exists. '});
        else
          return res.send(err);
      }
      res.json({ message: 'User created!'});
    });
  }).get(function(req, res) {
      User.find(function(err, users) {
        if (err) res.send(err);
        //return users
        res.json(users);
      });
  });

  //on routes that end in /users/:user_id
  apiRouter.route('/users/:user_id')
    .get(function(req, res) {
      User.findById(req.params.user_id, function(err, user) {
         if (err) res.send(err);

         //return user
         res.json(user);
      });
    })
    //update user info
    .put(function(req, res) {
      User.findById(req.params.user_id, function(err, user) {
        if (err) res.send(err);

        //update user info
        if (req.body.name) user.name = req.body.name;
        if (req.body.username) user.username = req.body.username;
        if (req.body.password) user.password = req.body.password;

        //save user info
        user.save(function(err) {
          if (err) res.send(err);

          res.json({ message: 'User updated!' });
        });
      });
    })

    //delete user
    .delete(function(req, res) {
        User.remove({ _id: req.params.user_id }, function(err, user) {
          if (err) res.send(err);

          res.json({ message: 'User Succesfully Deleted' });
      });
    });

  // on routes that end in /users
  apiRouter.route('/containers')
    .post(function(req, res) {
      //create new instance of container model
      var container = new Container();

      container.name = req.body.name;
      container.address = req.body.address;
      container.description = req.body.description;
      container.geolocation = req.body.geolocation;

      //save container info
      container.save(function(err) {
        if (err) {
          if (err.code == 11000)
            return res.json({ success: false, message: 'A container with that\
            name already exists. '});
          else
            return res.send(err);
        }
        res.json({ message: 'Container created!'});
      });
    }).get(function(req, res) {
        Container.find(function(err, containers) {
          if (err) res.send(err);
          //return containers
          res.json(containers);
        });
    });

apiRouter.route('/containers/:container_id')
  .get(function(req, res) {
    Container.findById(req.params.container_id, function(err, container) {
      if (err) res.send(err);
      //return container
      res.json(container);
    });
  })
  .put(function(req, res) {
    Container.findById(req.params.container_id, function(err, container) {
      if (err) res.send(err);

      //update container info
      if (req.body.name) container.name = req.body.name;
      if (req.body.address) container.address = req.body.address;
      if (req.body.geolocation) container.geolocation = req.body.geolocation;
      if (req.body.description) container.description = req.body.description;

      //save info
      container.save(function(err) {
        if (err) res.send(err);

        res.json({ message: 'Container Updated' });
      });
    });
  })
  .delete(function(req, res) {
    Container.remove({ _id: req.params.container_id }, function(err, container) {
      if (err) res.send(err);

      res.json({ message: 'Container with id: ' + req.params.container_id + ' deleted'});
    });
  });


// Register our ROUTES
app.use('/api', apiRouter);

app.listen(port);

console.log('container store is live on port' + port);
