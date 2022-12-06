const loggedOutLinks = document.querySelectorAll(".logged-out");
const loggedInLinks = document.querySelectorAll(".logged-in");
const descriptioncontainer = document.querySelectorAll(".description-container")
const contentElement = document.querySelectorAll(".content-sign-in");
const tempGauge = document.querySelectorAll(".g2")
const humGauge = document.querySelectorAll(".g3")
const presGauge = document.querySelectorAll(".g4")

export const loginCheck = (user) => {
    if (user) {
        loggedInLinks.forEach((link) => (link.style.display = "block"));
        loggedOutLinks.forEach((link) => (link.style.display = "none"));
        descriptioncontainer.forEach((link) => (link.style.display = "none"))
        contentElement.forEach((link) => (link.style.display = "block"));
        tempGauge.forEach((link) => link.style.display = "block")
        humGauge.forEach((link) => link.style.display = "block")
        presGauge.forEach((link) => link.style.display = "block")
      } else {
        //Usuario exit
        loggedInLinks.forEach((link) => (link.style.display = "none"));
        loggedOutLinks.forEach((link) => (link.style.display = "block"));
        descriptioncontainer.forEach((link) => (link.style.display = ""))
        contentElement.forEach((link) => (link.style.display = "none"));
        tempGauge.forEach((link) => link.style.display = "none")
        humGauge.forEach((link) => link.style.display = "none")
        presGauge.forEach((link) => link.style.display = "none")
      }
};