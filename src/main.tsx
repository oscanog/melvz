import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ReactUI from "./ReactUI";
import { Provider } from "jotai";
import { store } from "./store";
import { OptionalConvexProvider } from "./convex/OptionalConvexProvider";
import { PortfolioContentProvider } from "./content/PortfolioContentProvider";

// NOTE: initGame() is no longer called here.
// It is triggered from LandingPage.tsx after the terminal sequence completes.

const ui = document.getElementById("ui") as HTMLElement;
const root = createRoot(ui);
root.render(
  <StrictMode>
    <OptionalConvexProvider>
      <Provider store={store}>
        <PortfolioContentProvider>
          <ReactUI />
        </PortfolioContentProvider>
      </Provider>
    </OptionalConvexProvider>
  </StrictMode>
);
