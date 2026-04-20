const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

navToggle.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    document.body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

const roles = [
  "Aspiring Software Developer",
  "Computer Programming Student",
  "Future Software Engineer",
];
const typedText = document.querySelector("#typed-text");
let roleIndex = 0;
let charIndex = 0;
let deleting = false;

function typeRole() {
  const currentRole = roles[roleIndex];
  typedText.textContent = currentRole.slice(0, charIndex);

  if (!deleting && charIndex < currentRole.length) {
    charIndex += 1;
    setTimeout(typeRole, 70);
    return;
  }

  if (!deleting && charIndex === currentRole.length) {
    deleting = true;
    setTimeout(typeRole, 1300);
    return;
  }

  if (deleting && charIndex > 0) {
    charIndex -= 1;
    setTimeout(typeRole, 35);
    return;
  }

  deleting = false;
  roleIndex = (roleIndex + 1) % roles.length;
  setTimeout(typeRole, 260);
}

typeRole();

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
