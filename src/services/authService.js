import api from "./api";

// LOGIN
export const login = async (data) => {
  const response = await api.post("/usuarios/login", data);

  const { accessToken, refreshToken, user } = response.data;

  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);

  localStorage.setItem("user", JSON.stringify(user));

  return { user };
};

// GET USER
export const getMe = async () => {
  const response = await api.get("/usuarios/me");
  return response.data;
};

// LOGOUT
export const logout = () => {
  // Garanta que o access o access token esteja como parametro da requisição
  const accessToken = localStorage.getItem("accessToken");

  // Passe no header
  api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

  api.post("/usuarios/logout");

  // Remova os tokens do localStorage
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");

  window.location.href = "/login";
};
