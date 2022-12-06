﻿export function showMessage(message, type = "success") {
    Toastify({
      text: message,
      duration: 3000,
      destination: "",
      newWindow: true,
      close: true,
      gravity: "bottom", // `top` or `bottom`
      position: "right", // `left`, `center` or `right`
      stopOnFocus: true, // Prevents dismissing of toast on hover
      style: {
        background: type === "success" ? "green" : "#8F141B",
      },
      // onClick: function () { } // Callback after click
    }).showToast();
  }