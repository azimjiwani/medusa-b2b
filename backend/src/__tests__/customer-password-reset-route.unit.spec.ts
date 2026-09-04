import { POST } from "../api/store/send-password-reset-email/route"

describe("customer password reset route", () => {
  const originalEnv = process.env
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      MEDUSA_BACKEND_URL: "https://backend.example.com",
      SENDGRID_CUSTOMER_RESET_PASSWORD_TEMPLATE: "test-template-id",
    }
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as never
  })

  afterAll(() => {
    process.env = originalEnv
    global.fetch = originalFetch
  })

  const createResponse = () => {
    const response = {
      json: jest.fn((body) => body),
      status: jest.fn(),
    }
    response.status.mockReturnValue(response)
    return response
  }

  it("requests a Medusa reset token with customer metadata", async () => {
    const query = {
      graph: jest.fn().mockResolvedValue({
        data: [
          {
            id: "cus_123",
            email: "customer@example.com",
            first_name: "Ada",
          },
        ],
      }),
    }
    const authModule = {
      listProviderIdentities: jest.fn().mockResolvedValue([
        { id: "pro_123", auth_identity_id: "auth_123" },
      ]),
      retrieveAuthIdentity: jest.fn().mockResolvedValue({
        app_metadata: { customer_id: "cus_123" },
      }),
    }
    const request = {
      body: { email: "Customer@Example.com" },
      scope: {
        resolve: jest.fn()
          .mockReturnValueOnce(query)
          .mockReturnValueOnce(authModule),
      },
    }
    const response = createResponse()

    await POST(request as never, response as never)

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(
      "https://backend.example.com/auth/customer/emailpass/reset-password",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          identifier: "customer@example.com",
          metadata: { first_name: "Ada" },
        }),
      })
    )
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      message: "Password reset email sent successfully",
    })
  })

  it("does not request a customer token for an identity owned by another actor", async () => {
    const query = {
      graph: jest.fn().mockResolvedValue({
        data: [{ id: "cus_123", email: "customer@example.com" }],
      }),
    }
    const authModule = {
      listProviderIdentities: jest.fn().mockResolvedValue([
        { id: "pro_123", auth_identity_id: "auth_123" },
      ]),
      retrieveAuthIdentity: jest.fn().mockResolvedValue({
        app_metadata: { user_id: "user_123" },
      }),
    }
    const request = {
      body: { email: "customer@example.com" },
      scope: {
        resolve: jest.fn()
          .mockReturnValueOnce(query)
          .mockReturnValueOnce(authModule),
      },
    }
    const response = createResponse()

    await POST(request as never, response as never)

    expect(global.fetch).not.toHaveBeenCalled()
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
    })
  })
})
