const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { join } = require("path");
const listEndpoints = require("express-list-endpoints");
const mongoose = require("mongoose");
const allRouter = require("./services/index");

const { notFoundHandler, badRequestHandler, genericErrorHandler } = require("./utilities/errorHandler");

const server = express();

const port = process.env.PORT || 3001;

server.use(express.json());

const whiteList = process.env.NODE_ENV === "production" ? [process.env.FE_URL_PROD] : [process.env.FE_URL_DEV];

const corsOptions =
  process.env.NODE_ENV === "production"
    ? {
        origin: function (origin, callback) {
          if (whiteList.indexOf(origin) !== -1) {
            // allowed
            callback(null, true);
          } else {
            // Not allowed
            callback(new Error("NOT ALLOWED - CORS ISSUES"));
          }
        },
      }
    : {};
server.use(helmet());
server.use(cors(corsOptions));

///APIs

server.use("/", allRouter);

// ERROR HANDLERS MIDDLEWARES

server.use(badRequestHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);
console.log(listEndpoints(server));

mongoose
  .connect(process.env.MONGO_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(
    server.listen(port, () => {
      if (process.env.NODE_ENV === "production") {
        console.log("Running on cloud on port", port);
      } else {
        console.log("Running locally on port", port);
      }
    })
  )
  .catch((err) => console.log(err));
