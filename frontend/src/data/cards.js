const API_URL = "http://localhost:8000/api";

export async function getCards() {
  try {
    const response = await fetch(`${API_URL}/stores`);
    if (!response.ok) {
      throw new Error("Failed to fetch stores");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching stores:", error);
    return [];
  }
}

export async function getCardById(id) {
  try {
    const response = await fetch(`${API_URL}/stores/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch store");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching store:", error);
    return null;
  }
}
