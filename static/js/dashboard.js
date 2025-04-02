document.addEventListener("click", function(event) {
  // If the clicked element has the class 'edit_name'
  if (event.target.closest(".edit_name")) {
      let parent = event.target.closest(".edit_name").parentNode;
      let inputField = parent.querySelector(".control_panel_edit");
      let applyButton = parent.querySelector(".apply_name");

      inputField.removeAttribute("readonly"); // Enable editing
      inputField.focus(); // Focus on input
      applyButton.style.display = "inline-block"; // Show Apply button
  }

  // If the clicked element has the class 'apply_name'
  if (event.target.classList.contains("apply_name")) {
      let parent = event.target.parentNode;
      let inputField = parent.querySelector(".control_panel_edit");
      let applyButton = parent.querySelector(".apply_name");

      inputField.setAttribute("readonly", true); // Make input readonly again
      applyButton.style.display = "none"; // Hide Apply button

      // Log the updated value to console
      console.log("Updated Value:", inputField.value);
  }
});