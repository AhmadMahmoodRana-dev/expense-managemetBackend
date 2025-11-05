import auth from "./auth.routes.js";
import budget from "./budget.routes.js";
import category from "./category.routes.js";

const mainWrapper = (app) => {
  app.use("/api",auth,category,budget);
};

export default mainWrapper;