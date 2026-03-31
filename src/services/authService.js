import api from "./api";

// LOGIN
export const login = async (data) => {
  const response = await api.post("/usuarios/login", data);

  const { accessToken, refreshToken, user } = response.data;

  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);

  return { user };
};

// GET USER
export const getMe = async () => {
  const response = await api.get("/usuarios/me");
  return response.data;
};

// LOGOUT
export const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};
