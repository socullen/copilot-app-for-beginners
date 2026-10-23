import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "../App";

afterEach(cleanup);

describe("App themes", () => {
  it("defaults to light and supports keyboard toggling in both directions", async () => {
    const user = userEvent.setup();
    render(<App />);

    const toggle = screen.getByRole("button", { name: "Dark theme", pressed: false });
    expect(document.documentElement.dataset.theme).toBe("light");

    await user.tab();
    expect(document.activeElement).toBe(toggle);
    await user.keyboard(" ");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");

    await user.keyboard("{Enter}");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
  });

  it.each(["light", "dark"])("preserves search, filters and stats in %s theme", async (theme) => {
    const user = userEvent.setup();
    render(<App />);
    const toggle = screen.getByRole("button", { name: "Dark theme" });
    if (theme === "dark") {
      await user.click(toggle);
    }

    const search = screen.getByRole("searchbox", { name: "Search" });
    await user.type(search, "LE GUIN");
    expect(screen.getByRole("heading", { name: "A Wizard of Earthsea" })).toBeTruthy();
    await user.click(toggle);
    expect(screen.getByLabelText<HTMLInputElement>("Search").value).toBe("LE GUIN");
    expect(screen.getByRole("heading", { name: "A Wizard of Earthsea" })).toBeTruthy();
    await user.click(toggle);

    await user.clear(search);
    await user.selectOptions(screen.getByRole("combobox", { name: "Genre" }), "Fantasy");
    await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "unread");
    expect(screen.getByRole("heading", { name: "The Night Circus" })).toBeTruthy();
    expect(screen.getAllByRole("article")).toHaveLength(1);
    const stats = screen.getByRole("region", { name: "Reading stats" });
    for (const label of ["Total: 1", "Read: 0", "Unread: 1", "Favorites: 0", "Average rating: 4.0"]) {
      expect(within(stats).getByLabelText(label)).toBeTruthy();
    }

    await user.click(toggle);
    expect(screen.getByLabelText<HTMLSelectElement>("Genre").value).toBe("Fantasy");
    expect(screen.getByLabelText<HTMLSelectElement>("Status").value).toBe("unread");
    expect(screen.getByRole("heading", { name: "The Night Circus" })).toBeTruthy();
    expect(within(stats).getByLabelText("Total: 1")).toBeTruthy();

    await user.type(search, "no matching title");
    expect(screen.queryAllByRole("article")).toHaveLength(0);
    expect(screen.getByRole("status").textContent).toContain(
      "Try a different search term, genre, or reading status."
    );
    expect(within(stats).getByLabelText("Total: 0")).toBeTruthy();
    expect(within(stats).getByLabelText("Average rating: 0.0")).toBeTruthy();
  });
});
