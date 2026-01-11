// Get container element
const container = document.getElementById("container");

// Create some sample items
for (let i = 0; i < 20; i++) {
  const item = document.createElement("div");
  item.className = "item";
  item.textContent = i + 1;
  item.setAttribute("data-id", (i + 1).toString());
  item.style.left = Math.random() * 500 + "px";
  item.style.top = Math.random() * 300 + "px";
  container.appendChild(item);
}

// Initialize Marquee Selector
const selector = new window.MarqueeSelector.default({
  container: container,
});

selector.addTarget({
  selector: ".item",
  onSelectionStart: (target) => {
    console.log("Selection started on:", target);
  },
  onSelectionChange: (selectedElements) => {
    console.log("Selected elements:", selectedElements.length);
    // Remove previous selection
    document.querySelectorAll(".selected").forEach((el) => {
      el.classList.remove("selected");
    });
    // Add new selection
    selectedElements.forEach((el) => {
      el.classList.add("selected");
    });
    // Update selected count
    document.getElementById("selectedCount").textContent = selectedElements.length;
  },
  onSelectionEnd: (selectedElements) => {
    console.log(
      "Selection ended with",
      selectedElements.length,
      "elements"
    );
  },
  onClearClick: () => {
    console.log("Selection cleared");
    document.querySelectorAll(".selected").forEach((el) => {
      el.classList.remove("selected");
    });
    document.getElementById("selectedCount").textContent = 0;
  },
});

// Enable the marquee selector
selector.enable();

// Reset function
window.resetSelection = () => {
  document.querySelectorAll(".selected").forEach((el) => {
    el.classList.remove("selected");
  });
  document.getElementById("selectedCount").textContent = 0;
  console.log("Selection reset");
};
