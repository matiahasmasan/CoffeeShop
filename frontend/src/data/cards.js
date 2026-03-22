const API_URL = "http://localhost:8000/api";

export async function getCards() {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${API_URL}/stores`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return [];
      }
      throw new Error("Failed to fetch stores");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching stores:", error);
    return [];
  }
}

export async function getCardById(id) {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`http://localhost:8000/api/stores/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return null;
      }
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching store:", error);
    return null;
  }
}
