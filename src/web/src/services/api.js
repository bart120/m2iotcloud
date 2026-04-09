import axios from "axios";

const api = axios.create({
    baseURL: "https://apidocvl.azurewebsites.net",
});

export default api;