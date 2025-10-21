import auth from "./auth.routes.js";
import category from "./category.routes.js";

const mainWrapper = (app) => {
  app.use("/api",auth,category);
};

export default mainWrapper;