
document.addEventListener("DOMContentLoaded", () => {
    const alerts = document.querySelectorAll(".alert");
    alerts.forEach((alert) => {
        setTimeout(() => {
            alert.classList.add("fade");
            setTimeout(() => alert.remove(), 500);
        }, 3000);
    });
});


const deleteLinks = document.querySelectorAll("a.btn-danger");
deleteLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
        const confirmDelete = confirm("Are you sure you want to delete this task?");
        if (!confirmDelete) {
            e.preventDefault();
        }
    });
});


const forms = document.querySelectorAll("form");
forms.forEach((form) => {
    form.addEventListener("submit", () => {
        const btn = form.querySelector("button[type='submit']");
        if (btn) {
            btn.disabled = true;
            btn.innerText = "Please wait...";
        }
    });
});


document.body.style.opacity = 0;
window.onload = () => {
    document.body.style.transition = "opacity 0.5s";
    document.body.style.opacity = 1;
};


const navLinks = document.querySelectorAll(".navbar-collapse .nav-link");
const navbar = document.querySelector(".navbar-collapse");

if (navbar) {
    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            if (navbar.classList.contains("show")) {
                new bootstrap.Collapse(navbar).toggle();
            }
        });
    });
}
