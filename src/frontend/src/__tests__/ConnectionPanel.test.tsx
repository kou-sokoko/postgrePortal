import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import ConnectionPanel from "../components/ConnectionPanel";

describe("ConnectionPanel", () => {
  it("renders all connection fields with default values", () => {
    render(<ConnectionPanel onFetch={vi.fn()} onCreateDatabase={vi.fn()} />);
    const hostInput = screen.getByLabelText("HOST") as HTMLInputElement;
    expect(hostInput.value).toBe("localhost");

    const dbInput = screen.getByLabelText("Database") as HTMLInputElement;
    expect(dbInput.value).toBe("postgres");

    const userInput = screen.getByLabelText("User") as HTMLInputElement;
    expect(userInput.value).toBe("postgres");

    const portInput = screen.getByLabelText("Port") as HTMLInputElement;
    expect(portInput.value).toBe("5432");
  });

  it("renders password field as masked input", () => {
    render(<ConnectionPanel onFetch={vi.fn()} onCreateDatabase={vi.fn()} />);
    const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
    expect(passwordInput.type).toBe("password");
  });

  it("renders fetch and create buttons", () => {
    render(<ConnectionPanel onFetch={vi.fn()} onCreateDatabase={vi.fn()} />);
    expect(screen.getByText("取得")).toBeInTheDocument();
    expect(screen.getByText("作成")).toBeInTheDocument();
  });

  it("calls onFetch with connection info when fetch button is clicked", async () => {
    const mockFetch = vi.fn();
    render(<ConnectionPanel onFetch={mockFetch} onCreateDatabase={vi.fn()} />);

    await userEvent.click(screen.getByText("取得"));
    expect(mockFetch).toHaveBeenCalledWith({
      host: "localhost",
      port: 5432,
      database: "postgres",
      user: "postgres",
      password: "",
    });
  });

  it("calls onCreateDatabase with connection info when create button is clicked", async () => {
    const mockCreate = vi.fn();
    render(<ConnectionPanel onFetch={vi.fn()} onCreateDatabase={mockCreate} />);

    await userEvent.click(screen.getByText("作成"));
    expect(mockCreate).toHaveBeenCalledWith({
      host: "localhost",
      port: 5432,
      database: "postgres",
      user: "postgres",
      password: "",
    });
  });

  it("calls onCreateDatabase with password when password is entered before clicking create button", async () => {
    const mockCreate = vi.fn();
    render(<ConnectionPanel onFetch={vi.fn()} onCreateDatabase={mockCreate} />);

    const passwordInput = screen.getByLabelText("Password");
    await userEvent.type(passwordInput, "mypassword");
    await userEvent.click(screen.getByText("作成"));
    expect(mockCreate).toHaveBeenCalledWith({
      host: "localhost",
      port: 5432,
      database: "postgres",
      user: "postgres",
      password: "mypassword",
    });
  });
});
