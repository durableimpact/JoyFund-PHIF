"use client";
import axios from "axios";

const config = {
  apiUrl: process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000",
};

const api = axios.create({
  baseURL: config.apiUrl,
});

export default api;