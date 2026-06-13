import { Route, Router } from "@solidjs/router";
import { App } from "./app";

export function Root() {
  return (
    <Router>
      <Route path="/" component={App} />
    </Router>
  );
}
