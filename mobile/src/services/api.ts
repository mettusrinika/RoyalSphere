import axios from "axios";
export const api=axios.create({baseURL:"https://royalsphere-api.onrender.com/api/v1",timeout:30000});
export const apiError=(e:any)=>{const m=e?.response?.data?.message;return Array.isArray(m)?m.join("\n"):m||(!e?.response?"Unable to connect to OMIQORA.":"Something went wrong.");};
