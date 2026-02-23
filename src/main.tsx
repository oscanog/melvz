import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ReactUI from "./ReactUI";
import { Provider } from "jotai";
import { store } from "./store";

// NOTE: initGame() is no longer called here.
// It is triggered from LandingPage.tsx after the terminal sequence completes.

const ui = document.getElementById("ui") as HTMLElement;
const root = createRoot(ui);
root.render(
  <StrictMode>
    <Provider store={store}>
      <ReactUI />
    </Provider>
  </StrictMode>
);
