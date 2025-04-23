
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




document.addEventListener("DOMContentLoaded", function () {
  const editButton = document.getElementById("edit_name_1");
  const applyButton = document.getElementById("apply_name_1");
  const inputField = document.getElementById("control_panel_edit_1");

  editButton.addEventListener("click", function () {
      inputField.removeAttribute("readonly");
      inputField.focus();
      applyButton.style.display = "inline-block";
  });

  applyButton.addEventListener("click", function () {
      let newName = inputField.value.trim();

      if (!newName) {
          alert("Panel name cannot be empty!");
          return;
      }

      fetch('/update_panel_name', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ panel_name: newName })
      })
      .then(response => response.json())
      .then(data => {
          if (data.error) {
              alert("Error: " + data.error);
          } else {
              console.log(data.message);
              inputField.setAttribute("readonly", true);
              applyButton.style.display = "none";
          }
      })
      .catch(error => console.error("Error:", error));
  });
});





document.addEventListener("DOMContentLoaded", function () {
  const editButton = document.getElementById("edit_name_2");
  const applyButton = document.getElementById("apply_name_2");
  const inputField = document.getElementById("control_panel_edit_2");

  editButton.addEventListener("click", function () {
      inputField.removeAttribute("readonly");
      inputField.focus();
      applyButton.style.display = "inline-block";
  });

  applyButton.addEventListener("click", function () {
      let newName = inputField.value.trim();

      if (!newName) {
          alert("Panel name cannot be empty!");
          return;
      }

      fetch('/update_panel_name_2', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ panel_name: newName })
      })
      .then(response => response.json())
      .then(data => {
          if (data.error) {
              alert("Error: " + data.error);
          } else {
              console.log(data.message);
              inputField.setAttribute("readonly", true);
              applyButton.style.display = "none";
          }
      })
      .catch(error => console.error("Error:", error));
  });
});


document.addEventListener("DOMContentLoaded", function () {
  const editButton = document.getElementById("edit_name_3");
  const applyButton = document.getElementById("apply_name_3");
  const inputField = document.getElementById("control_panel_edit_3");

  editButton.addEventListener("click", function () {
      inputField.removeAttribute("readonly");
      inputField.focus();
      applyButton.style.display = "inline-block";
  });

  applyButton.addEventListener("click", function () {
      let newName = inputField.value.trim();

      if (!newName) {
          alert("Panel name cannot be empty!");
          return;
      }

      fetch('/update_panel_name_3', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ panel_name: newName })
      })
      .then(response => response.json())
      .then(data => {
          if (data.error) {
              alert("Error: " + data.error);
          } else {
              console.log(data.message);
              inputField.setAttribute("readonly", true);
              applyButton.style.display = "none";
          }
      })
      .catch(error => console.error("Error:", error));
  });
});