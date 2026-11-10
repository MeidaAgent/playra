const loginForm = document.querySelector("#login-form");
const loginStatus = document.querySelector("#login-status");

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginStatus.textContent = "Memeriksa...";
  const password = new FormData(loginForm).get("password");

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Permintaan gagal.");
    }
    window.location.replace("/developer");
  } catch (error) {
    loginStatus.textContent = error.message;
  }
});

