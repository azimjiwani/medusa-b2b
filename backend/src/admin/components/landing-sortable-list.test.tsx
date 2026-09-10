import { useState } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LandingSortableList } from "./landing-sortable-list";

const initial = [
  { id: "a", title: "Fresh finds" },
  { id: "b", title: "Essentials" },
  { id: "c", title: "Phones" },
];
function Editor({ disabled = false, onReorder = vi.fn() }) {
  const [items, setItems] = useState(initial);
  return (
    <LandingSortableList
      items={items}
      label="Sections order"
      getLabel={(item) => item.title}
      disabled={disabled}
      onReorder={(next) => {
        setItems(next);
        onReorder(next);
      }}
    >
      {(item) => <button type="button">Edit {item.title}</button>}
    </LandingSortableList>
  );
}
const order = () =>
  within(screen.getByRole("group", { name: "Sections order" }))
    .getAllByRole("button", { name: /^Edit / })
    .map((button) => button.textContent);
const key = (target: Element | Document, code: string) =>
  fireEvent.keyDown(target, { code, key: code === "Space" ? " " : code });

beforeEach(() => {
  // Give the real drag sensors measured rows; jsdom does not perform layout.
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      const isRow =
        this.parentElement?.getAttribute("aria-label") === "Sections order";
      const index = isRow
        ? Array.from(this.parentElement!.children).indexOf(this)
        : 0;
      return {
        x: 0,
        y: index * 110,
        left: 0,
        top: index * 110,
        right: 240,
        bottom: index * 110 + 100,
        width: 240,
        height: 100,
        toJSON() {},
      };
    }
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("landing page drag ordering", () => {
  it("reorders with the keyboard while preserving each item's content", async () => {
    const onReorder = vi.fn();
    render(<Editor onReorder={onReorder} />);
    const handle = screen.getByRole("button", { name: "Reorder Fresh finds" });
    handle.focus();
    key(handle, "Space");
    await waitFor(() =>
      expect(handle.getAttribute("aria-pressed")).toBe("true")
    );
    key(document, "ArrowDown");
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain("position 2")
    );
    key(document, "Space");
    await waitFor(() =>
      expect(order()).toEqual([
        "Edit Essentials",
        "Edit Fresh finds",
        "Edit Phones",
      ])
    );
    expect(onReorder).toHaveBeenCalledWith([
      initial[1],
      initial[0],
      initial[2],
    ]);
  });

  it("cancels a keyboard drag without changing the draft", async () => {
    const onReorder = vi.fn();
    render(<Editor onReorder={onReorder} />);
    const handle = screen.getByRole("button", { name: "Reorder Fresh finds" });
    handle.focus();
    key(handle, "Space");
    await waitFor(() =>
      expect(handle.getAttribute("aria-pressed")).toBe("true")
    );
    key(document, "ArrowDown");
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain("position 2")
    );
    key(document, "Escape");
    expect(order()).toEqual(initial.map((item) => `Edit ${item.title}`));
    expect(onReorder).not.toHaveBeenCalled();
  });

  it.each(["mouse", "touch"])(
    "reorders from the handle with a %s pointer",
    async (pointerType) => {
      class TestPointerEvent extends MouseEvent {
        isPrimary = true;
        pointerId = 1;
        pointerType = pointerType;
      }
      vi.stubGlobal("PointerEvent", TestPointerEvent);
      render(<Editor />);
      const handle = screen.getByRole("button", {
        name: "Reorder Fresh finds",
      });
      fireEvent.pointerDown(handle, { clientX: 220, clientY: 25, button: 0 });
      fireEvent.pointerMove(document, { clientX: 220, clientY: 35 });
      await waitFor(() =>
        expect(handle.getAttribute("aria-pressed")).toBe("true")
      );
      fireEvent.pointerMove(document, { clientX: 220, clientY: 145 });
      await waitFor(() =>
        expect(screen.getByRole("status").textContent).toContain("position 2")
      );
      fireEvent.pointerUp(document);
      await waitFor(() =>
        expect(order()).toEqual([
          "Edit Essentials",
          "Edit Fresh finds",
          "Edit Phones",
        ])
      );
    }
  );

  it("disables handles while saving or uploading", () => {
    render(<Editor disabled />);
    for (const button of screen.getAllByRole("button", { name: /^Reorder / }))
      expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("keeps ordinary edit clicks separate from dragging", () => {
    const onReorder = vi.fn();
    render(<Editor onReorder={onReorder} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit Essentials" }));
    expect(onReorder).not.toHaveBeenCalled();
  });
});
