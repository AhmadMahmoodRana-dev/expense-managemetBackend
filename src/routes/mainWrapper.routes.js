import auth from "./auth.routes.js";

const mainWrapper = (app) => {
  app.use("/api",auth);
};

export default mainWrapper;