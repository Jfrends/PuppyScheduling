import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Signup from "../src/pages/signup.jsx";
import { AuthContext } from "../src/contexts/AuthContext.jsx";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

global.fetch = jest.fn();

global.atob = (str) => Buffer.from(str, "base64").toString("binary");

describe("Signup Component", () => {
  const mockLogin = jest.fn();

  const renderComponent = () => {
    return render(
      <AuthContext.Provider value={{ login: mockLogin }}>
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      </AuthContext.Provider>,
    );
  };

  beforeEach(() => {
    fetch.mockClear();
    mockNavigate.mockClear();
    mockLogin.mockClear();
  });

  test("renders the signup form correctly", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", { name: /welcome/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i }),
    ).toBeInTheDocument();
  });

  test("allows user to type into name, email, and password fields", () => {
    renderComponent();
    const nameInput = screen.getByPlaceholderText(/name/i);
    const emailInput = screen.getByPlaceholderText(/email address/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(nameInput.value).toBe("Test User");
    expect(emailInput.value).toBe("test@example.com");
    expect(passwordInput.value).toBe("password123");
  });

  test("toggles password visibility when show/hide button is clicked", () => {
    renderComponent();
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const showHideButton = screen.getByRole("button", { name: /show/i });

    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(showHideButton);
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: /hide/i })).toBeInTheDocument();
  });

  test("handles successful signup", async () => {
    const mockToken = "header.eyJzdWIiOiIxMjM0NSJ9.signature";
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: mockToken }),
    });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(
        screen.getByText("User created successfully!"),
      ).toBeInTheDocument();
    });

    expect(mockLogin).toHaveBeenCalledWith(mockToken);
    expect(mockNavigate).toHaveBeenCalledWith("/12345/schedule");
  });

  test("handles failed signup and displays an error message", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Email already in use" }),
    });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText("Email already in use")).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
