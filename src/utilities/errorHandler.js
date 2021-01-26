const badRequestHandler = (err, req, res, next) => {
  if (err.httpStatusCode === 400) {
    res.status(400).send(err.message);
  }
  next(err);
};

const notFoundHandler = (err, req, res, next) => {
  if (err.httpStatusCode === 404) {
    res.status(404).send(err.message);
  }
  next(err);
};

const genericErrorHandler = (err, req, res, next) => {
  if (!res.headersSent) {
    res.status(err.httpStatusCode || 500).send(err.message);
  }
};
const verifyToken = (req, res, next) => {
  const barrierHeader = req.headers["authorization"];
  if (typeof barrierHeader !== "undefined") {
    const barrierTocken = barrierHeader.split(" ")[1];
    req.token = barrierTocken;
    next();
  } else {
    res.sendStatus(403);
  }
};
module.exports = {
  badRequestHandler,
  notFoundHandler,
  genericErrorHandler,
  verifyToken,
};
