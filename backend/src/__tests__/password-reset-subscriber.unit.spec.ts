import passwordResetHandler from "../subscribers/password-reset"

describe("password reset subscriber", () => {
  const originalEnv = process.env
  const sendPasswordResetEmail = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      MEDUSA_STOREFRONT_URL: "https://store.example.com",
      MEDUSA_BACKEND_URL: "https://backend.example.com",
      RESEND_API_KEY: "re_test-api-key",
      RESEND_FROM: "Medusa Support <support@example.com>",
    }
    sendPasswordResetEmail.mockResolvedValue(undefined)
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it("emails customers the exact Medusa-issued reset token", async () => {
    const token = "header.payload.signature"
    const container = {
      resolve: jest.fn().mockReturnValue({ sendPasswordResetEmail }),
    }

    await passwordResetHandler({
      event: {
        data: {
          actor_type: "customer",
          entity_id: "customer@example.com",
          metadata: { first_name: "Ada" },
          token,
        },
      },
      container,
    } as never)

    expect(container.resolve).toHaveBeenCalledWith("emailService")
    expect(sendPasswordResetEmail).toHaveBeenCalledWith({
      to: "customer@example.com",
      customer: {
        email: "customer@example.com",
        first_name: "Ada",
      },
      token,
      actorType: "customer",
    })
  })
})
