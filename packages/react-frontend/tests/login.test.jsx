import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../src/pages/login.jsx";
import { AuthContext } from "../src/contexts/AuthContext.jsx";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

global.fetch = jest.fn();

global.atob = (str) => Buffer.from(str, "base64").toString("binary");

describe("Login Component", () => {
  const mockLogin = jest.fn();

  const renderComponent = () => {
    return render(
      <AuthContext.Provider value={{ login: mockLogin }}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthContext.Provider>,
    );
  };

  beforeEach(() => {
    fetch.mockClear();
    mockNavigate.mockClear();
    mockLogin.mockClear();
  });

  test("renders the login form correctly", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", { name: /welcome/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  test("allows user to type into email and password fields", () => {
    renderComponent();
    const emailInput = screen.getByPlaceholderText(/email address/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

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

    fireEvent.click(showHideButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("handles successful login", async () => {
    const mockToken = "header.eyJzdWIiOiIxMjM0NSJ9.signature";
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: mockToken }),
    });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(
        screen.getByText("User logged in successfully!"),
      ).toBeInTheDocument();
    });

    expect(mockLogin).toHaveBeenCalledWith(mockToken);
    expect(mockNavigate).toHaveBeenCalledWith("/12345/schedule");
  });

  test("handles failed login and displays an error message", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Invalid credentials" }),
    });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: "wrong@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
