import express from "express";
import compression from "compression";  // compresses requests
import session from "express-session";
import bodyParser from "body-parser";
import lusca from "lusca";
import dotenv from "dotenv";
import mongo from "connect-mongo";
import flash from "express-flash";
import path from "path";
import mongoose from "mongoose";
import passport from "passport";
import bluebird from "bluebird";
import { MONGODB_URI, SESSION_SECRET } from "./util/secrets";

const MongoStore = mongo(session);

// Controllers (route handlers)
import * as homeController from "./controllers/home";
import * as userController from "./controllers/user";
import * as contactController from "./controllers/contact";

import * as systemController from "./controllers/apis/system";
import * as teamsController from "./controllers/apis/teams";
import * as usersController from "./controllers/apis/users";
import * as boardsController from "./controllers/apis/boards";
import * as transfersController from "./controllers/apis/transfers";

// API keys and Passport configuration
import * as passportConfig from "./config/passport";

// Create Express server
const app = express();

// Connect to MongoDB
const mongoUrl = MONGODB_URI;
(<any>mongoose).Promise = bluebird;

mongoose.connect(mongoUrl, { useNewUrlParser: true} ).then(
  () => { /** ready to use. The `mongoose.connect()` promise resolves to undefined. */ },
).catch(err => {
  console.log("MongoDB connection error. Please make sure MongoDB is running. " + err);
  // process.exit();
});

// Express configuration
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: SESSION_SECRET,
  store: new MongoStore({
    url: mongoUrl,
    autoReconnect: true
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user &&
    req.path !== "/login" &&
    req.path !== "/signup" &&
    !req.path.match(/^\/auth/) &&
    !req.path.match(/\./)) {
    req.session.returnTo = req.path;
  } else if (req.user &&
    req.path == "/account") {
    req.session.returnTo = req.path;
  }
  next();
});

app.use(
  express.static(path.join(__dirname, "public"), { maxAge: 31557600000 })
);

/**
 * Primary app routes.
 */
app.get("/", homeController.index);
app.get("/login", userController.getLogin);
app.post("/login", userController.postLogin);
app.get("/logout", userController.logout);
app.get("/forgot", userController.getForgot);
app.post("/forgot", userController.postForgot);
app.get("/reset/:token", userController.getReset);
app.post("/reset/:token", userController.postReset);
app.get("/signup", userController.getSignup);
app.post("/signup", userController.postSignup);
app.get("/contact", contactController.getContact);
app.post("/contact", contactController.postContact);
app.get("/account", passportConfig.isAuthenticated, userController.getAccount);
app.post("/account/profile", passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post("/account/password", passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post("/account/delete", passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get("/account/unlink/:provider", passportConfig.isAuthenticated, userController.getOauthUnlink);

/**
 * API examples routes.
 */
app.get("/api", systemController.getApi);
app.get("/api/facebook", passportConfig.isAuthenticated, passportConfig.isAuthorized, systemController.getFacebook);

/**
 * OAuth authentication routes. (Sign in)
 */
app.get("/auth/facebook", passport.authenticate("facebook", { scope: ["email", "public_profile"] }));
app.get("/auth/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/login" }), (req, res) => {
  res.redirect(req.session.returnTo || "/");
});

app.get("/api/system", systemController.getSystem);

app.get("/api/users", usersController.getUsers);
app.post("/api/users", usersController.postUsers);
app.get("/api/users/:id", usersController.getUser);
app.patch("/api/users/:id", usersController.patchUser);

app.get("/api/teams", teamsController.getTeams);
app.post("/api/teams", teamsController.postTeams);
app.get("/api/teams/:id", teamsController.getTeam);
app.patch("/api/teams/:id", teamsController.patchTeam);

app.get("/api/boards", boardsController.getBoards);
app.post("/api/boards", boardsController.postBoards);
app.get("/api/boards/:id", boardsController.getBoard);
app.patch("/api/boards/:id", boardsController.patchBoard);
app.post("/api/boards/:boardId/posts", boardsController.postPosts);
app.get("/api/boards/:boardId/posts/:id", boardsController.getPost);
app.patch("/api/boards/:boardId/posts/:id", boardsController.patchPost);

app.get("/api/transfers", transfersController.getTransfers);
app.post("/api/transfers", transfersController.postTransfers);
app.get("/api/transfers/:id", transfersController.getTransfer);

export default app;
