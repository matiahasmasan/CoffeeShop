const API_URL = `${import.meta.env.VITE_API_URL}/api`;

export async function getCards(params = {}) {
  const token = localStorage.getItem("token");
  const query = new URLSearchParams();
  if (params.limit != null) query.set("limit", params.limit);
  if (params.offset != null) query.set("offset", params.offset);
  if (params.search) query.set("search", params.search);
  if (params.rating) query.set("rating", params.rating);
  if (params.liked) query.set("liked", "true");
  if (params.sort) query.set("sort", params.sort);
  const qs = query.toString();

  try {
    const response = await fetch(`${API_URL}/stores${qs ? `?${qs}` : ""}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return { stores: [], total: 0 };
      }
      throw new Error("Failed to fetch stores");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching stores:", error);
    return { stores: [], total: 0 };
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
    console.error("Error fetching card:", error);
    return null;
  }
}

export async function getLikedStores() {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${API_URL}/likes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error fetching liked stores:", error);
    return [];
  }
}

export async function likeStore(storeId) {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${API_URL}/likes/${storeId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return await response.json();
  } catch (error) {
    console.error("Error liking store:", error);
    return null;
  }
}

export async function unlikeStore(storeId) {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${API_URL}/likes/${storeId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return await response.json();
  } catch (error) {
    console.error("Error unliking store:", error);
    return null;
  }
}

export async function getUserCards() {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${API_URL}/cards`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return [];
      }
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching user cards:", error);
    return [];
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
