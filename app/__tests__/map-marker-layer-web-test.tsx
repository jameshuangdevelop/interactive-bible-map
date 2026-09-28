/** @jest-environment jsdom */

import { act } from "react";
import { createRoot } from "react-dom/client";

import { MapMarkerLayer, type ScreenMarker } from "../src/features/map/map-marker-layer.web";

describe("MapMarkerLayer", () => {
  test("renders keyboard-focusable marker buttons with labels and selected-pin growth", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onMarkerActivate = jest.fn<void, [ScreenMarker]>();

    const markers: ScreenMarker[] = [
      {
        id: "capernaum-pin",
        kind: "pin",
        x: 120,
        y: 100,
        selected: false,
        color: "#C5221F",
        accessibleName: "Capernaum, city",
        title: "Capernaum, city",
        inlineLabel: "Capernaum",
        showQuestionBadge: false
      },
      {
        id: "selected-pin",
        kind: "pin",
        x: 160,
        y: 120,
        selected: true,
        color: "#C5221F",
        accessibleName: "Jerusalem, city",
        title: "Jerusalem, city",
        inlineLabel: "Jerusalem",
        showQuestionBadge: false
      },
      {
        id: "cluster-1",
        kind: "cluster",
        x: 200,
        y: 180,
        selected: false,
        color: "#C5221F",
        accessibleName: "Cluster of 4 places",
        title: "4 places",
        clusterCount: 4
      },
      {
        id: "galilee-label",
        kind: "region-label",
        x: 260,
        y: 220,
        selected: false,
        color: "#5F6368",
        accessibleName: "Galilee, region",
        title: "Galilee, region",
        inlineLabel: "Galilee"
      },
      {
        id: "hidden-label-pin",
        kind: "pin",
        x: 300,
        y: 120,
        selected: false,
        color: "#C5221F",
        accessibleName: "Hidden place, city",
        title: "Hidden place, city",
        inlineLabel: "Hidden place",
        showInlineLabel: false
      }
    ];

    act(() => {
      root.render(<MapMarkerLayer markers={markers} onMarkerActivate={onMarkerActivate} />);
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons).toHaveLength(5);
    expect(buttons[0].tagName).toBe("BUTTON");
    expect(buttons[0].getAttribute("aria-label")).toBe("Capernaum, city");
    expect(buttons[2].getAttribute("aria-label")).toBe("Cluster of 4 places");
    expect(buttons[3].textContent).toContain("Galilee");

    const inlineLabels = Array.from(
      container.querySelectorAll("[data-marker-inline-label]")
    ).map((element) => element.textContent);
    expect(inlineLabels).toContain("Capernaum");
    expect(inlineLabels).toContain("Jerusalem");
    expect(inlineLabels).not.toContain("Hidden place");

    const dots = Array.from(container.querySelectorAll("[data-marker-dot]"));
    expect(dots).toHaveLength(3);
    const regularDot = dots[0] as HTMLElement;
    const selectedDot = dots[1] as HTMLElement;
    expect(regularDot.style.width).toBe("16px");
    expect(selectedDot.style.width).toBe("21px");
    expect(selectedDot.style.boxShadow).toContain("rgba");

    const clusterBubble = container.querySelector(
      "[data-marker-cluster-bubble]"
    ) as HTMLElement | null;
    expect(clusterBubble).toBeTruthy();
    expect(clusterBubble?.style.backgroundColor).toBe("rgb(197, 34, 31)");
    expect(clusterBubble?.style.border).toContain("3px");

    buttons[0].focus();
    expect(document.activeElement).toBe(buttons[0]);
    buttons[2].focus();
    expect(document.activeElement).toBe(buttons[2]);

    act(() => {
      buttons[0].click();
      buttons[2].click();
    });

    expect(onMarkerActivate).toHaveBeenCalledTimes(2);

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
