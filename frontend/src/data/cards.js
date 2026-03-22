const API_URL = "http://localhost:8000/api";

export async function getCards() {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${API_URL}/stores`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.error("Acces refuzat la lista de magazine (Token invalid)");
      }
      throw new Error("Failed to fetch stores");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching stores:", error);
    return [];
  }
}

// Replace getCardById with this:
export async function getCardById(storeId) {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${API_URL}/cards/${storeId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error fetching card:", error);
    return null;
  }
}

// Add this for claiming:
export async function claimCard(storeId) {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${API_URL}/cards/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ store_id: storeId }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error claiming card:", error);
    return null;
  }
}
