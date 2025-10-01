import auth from "./auth.routes.js";

const mainWrapper = (app) => {
  app.use("/app",auth);
};

export default mainWrapper;
