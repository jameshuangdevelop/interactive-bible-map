import { render } from "@testing-library/react-native";

import App from "../App";

describe("App shell", () => {
  test("renders map, search, and panel placeholders", async () => {
    const screen = await render(<App />);

    expect(screen.getByLabelText("Map")).toBeTruthy();
    expect(screen.getByLabelText("Place details")).toBeTruthy();
    expect(screen.getByPlaceholderText("Search biblical places")).toBeTruthy();
    expect(screen.getByText("Place panel placeholder")).toBeTruthy();
  });
});
