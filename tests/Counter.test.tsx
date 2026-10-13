import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount((value) => value + 1)}>
        Increment
      </button>
    </div>
  );
}

describe("Counter", () => {
  it("increments the count when clicked", async () => {
    const user = userEvent.setup();

    render(<Counter />);

    expect(screen.getByText("Count: 0")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Increment" }),
    );

    expect(screen.getByText("Count: 1")).toBeInTheDocument();
  });
});