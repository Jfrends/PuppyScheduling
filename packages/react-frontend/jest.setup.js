import { TextEncoder, TextDecoder } from "util";

Object.assign(global, { TextDecoder, TextEncoder });

import "@testing-library/jest-dom";

// fake url for testing
process.env.VITE_API_BASE_URL = "http://fake-api.com";
